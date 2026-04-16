import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { WikiPage } from '../models/types';
import { FrontmatterMetadata, generateFrontmatter, parseMarkdownWithFrontmatter } from '../utils/markdown-parser';

type ChatModelRequest = {
  model?: {
    sendRequest: (
      messages: unknown[],
      options: Record<string, never>,
      token: vscode.CancellationToken
    ) => Promise<{ text: AsyncIterable<string> }>;
  };
};

export interface GuidelineRewriteParams {
  page: WikiPage;
  wikiDir: string;
  sourceReference: string;
  sourceText: string;
  allowedBacklinks: string[];
  request: ChatModelRequest;
  token: vscode.CancellationToken;
}

export interface GuidelineRewriteResult {
  updated: boolean;
  reason?: string;
}

export class GuidelineTransformer {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async alignPageToGuideline(params: GuidelineRewriteParams): Promise<GuidelineRewriteResult> {
    const configuration = vscode.workspace.getConfiguration('wiki');
    const remoteLLMEnabled = configuration.get<boolean>('enableRemoteLLM', false);

    if (!remoteLLMEnabled) {
      return { updated: false, reason: 'remote-llm-disabled' };
    }

    if (!params.request.model) {
      return { updated: false, reason: 'chat-model-unavailable' };
    }

    const languageModelFactory = (vscode as unknown as {
      LanguageModelChatMessage?: { User: (content: string) => unknown };
    }).LanguageModelChatMessage;

    if (!languageModelFactory) {
      return { updated: false, reason: 'language-model-api-unavailable' };
    }

    const guidelineReference = this.loadGuidelineReference(params.wikiDir);
    const prompt = this.buildPrompt(params, guidelineReference);

    try {
      const response = await params.request.model.sendRequest(
        [languageModelFactory.User(prompt)],
        {},
        params.token
      );

      let rewrittenBody = '';
      for await (const fragment of response.text) {
        rewrittenBody += String(fragment);
      }

      rewrittenBody = this.normalizeModelOutput(rewrittenBody);
      if (!rewrittenBody.trim()) {
        return { updated: false, reason: 'empty-model-output' };
      }

      const pagePath = path.join(params.wikiDir, `${params.page.id}.md`);
      const frontmatter: FrontmatterMetadata = {
        title: params.page.title,
        aliases: params.page.aliases,
        tags: params.page.tags,
        links: params.page.sourceReferences && params.page.sourceReferences.length > 0
          ? params.page.sourceReferences
          : [],
        created: params.page.created,
        modified: new Date().toISOString(),
        source: params.page.sourceReferences?.[0],
      };

      fs.writeFileSync(pagePath, `${generateFrontmatter(frontmatter)}\n${rewrittenBody.trim()}\n`, 'utf-8');
      this.logger.info(`Aligned guideline page with LLM chat: ${params.page.id}`);
      return { updated: true };
    } catch (error) {
      this.logger.warn(`Guideline rewrite failed for ${params.page.id}: ${String(error)}`);
      return { updated: false, reason: String(error) };
    }
  }

  private buildPrompt(params: GuidelineRewriteParams, guidelineReference: string): string {
    const backlinkList = params.allowedBacklinks.length > 0
      ? params.allowedBacklinks.map((title) => `- ${title}`).join('\n')
      : '- none';

    return [
      'Rewrite the generated wiki page so it aligns with the DataBook wiki format reference.',
      'Return markdown body only. Do not include YAML frontmatter. Do not use code fences around the whole answer.',
      'Ground every claim in the provided source text or the current generated page. Omit unsupported sections instead of inventing content.',
      'Use wiki-style backlinks only when the target is present in the allowed backlink list. Do not invent or guess backlink targets.',
      'Keep this as a single wiki page for the source document.',
      '',
      'Reference format guidance:',
      guidelineReference,
      '',
      `Source reference: ${params.sourceReference}`,
      '',
      'Allowed backlink targets:',
      backlinkList,
      '',
      'Current generated page body:',
      params.page.content,
      '',
      'Source text:',
      params.sourceText,
    ].join('\n');
  }

  private loadGuidelineReference(wikiDir: string): string {
    const workspaceRoot = path.dirname(wikiDir);
    const guidelinePath = path.join(workspaceRoot, 'docs', 'guidelines', 'wiki_format_guidelines.md');

    if (fs.existsSync(guidelinePath)) {
      return fs.readFileSync(guidelinePath, 'utf-8').slice(0, 12000);
    }

    return [
      'Use a DataBook-style markdown page with YAML frontmatter preserved outside the model output.',
      'Prefer sections such as Summary, Definition, Taxonomy, Relationships, Metadata, Validation Rules, Provenance, and Lineage when supported by the source.',
      'Use wiki backlinks like [[Concept Name]] only for known existing pages.',
      'Omit unsupported sections.',
    ].join('\n');
  }

  private normalizeModelOutput(output: string): string {
    const trimmed = output.trim();
    const withoutFence = trimmed.startsWith('```')
      ? trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim()
      : trimmed;
    const parsed = parseMarkdownWithFrontmatter(withoutFence);
    return parsed.content || withoutFence;
  }
}