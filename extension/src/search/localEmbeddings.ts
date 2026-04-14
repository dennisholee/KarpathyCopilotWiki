/**
 * Local Embeddings Fallback
 * Placeholder for sentence-transformers integration (Phase 3)
 * Provides semantic search via local embeddings when Copilot API unavailable
 */

import { Logger } from '../utils/logger';
import { WikiPage } from '../models/types';

export interface EmbeddingVector {
  text: string;
  embedding: number[];
  pageId: string;
}

export class LocalEmbeddings {
  private logger: Logger;
  private embeddings: Map<string, EmbeddingVector> = new Map();
  private isAvailable: boolean = false;

  constructor(logger: Logger) {
    this.logger = logger;
    this.initialize();
  }

  /**
   * Initialize local embeddings
   * TODO (Phase 3): Load sentence-transformers model
   */
  private initialize(): void {
    try {
      // TODO: In Phase 3, load sentence-transformers/all-MiniLM-L6-v2 here
      // const { pipeline } = require('@xenova/transformers');
      // this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

      this.logger.info('Local embeddings: Ready for Phase 3 integration');
      this.isAvailable = false; // Disabled until transformers library is available
    } catch (error) {
      this.logger.debug(
        `Local embeddings not available: ${String(error)}. Will fall back to keyword search.`
      );
      this.isAvailable = false;
    }
  }

  /**
   * Check if local embeddings are available
   */
  available(): boolean {
    return this.isAvailable;
  }

  /**
   * Generate embedding for text
   * TODO (Phase 3): Implement with actual model
   */
  async embed(text: string): Promise<number[] | null> {
    if (!this.isAvailable) {
      this.logger.debug('Local embeddings not available');
      return null;
    }

    try {
      // TODO: Implement actual embedding generation
      // const embedding = await this.extractor(text);
      // return embedding;

      this.logger.debug('Embedding generation placeholder (Phase 3)');
      return null;
    } catch (error) {
      this.logger.error(`Embedding generation failed: ${String(error)}`);
      return null;
    }
  }

  /**
   * Build embeddings index from wiki pages
   * TODO (Phase 3): Implement with actual model
   */
  async buildIndex(pages: WikiPage[]): Promise<void> {
    if (!this.isAvailable) {
      this.logger.debug('Skipping embedding index build (not available)');
      return;
    }

    try {
      this.logger.info(`Building embeddings index for ${pages.length} pages`);

      // TODO: Generate embeddings for each page
      for (const page of pages) {
        // const embedding = await this.embed(page.plaintext || page.content);
        // if (embedding) {
        //   this.embeddings.set(page.id, { text: page.title, embedding, pageId: page.id });
        // }
      }

      this.logger.info(`Embedding index built for ${this.embeddings.size} pages`);
    } catch (error) {
      this.logger.error(`Index building failed: ${String(error)}`);
    }
  }

  /**
   * Semantic search using local embeddings
   * TODO (Phase 3): Implement with actual similarity computation
   */
  async search(query: string, topK: number = 5): Promise<Array<{ pageId: string; score: number }>> {
    if (!this.isAvailable) {
      this.logger.debug('Local embeddings search not available');
      return [];
    }

    try {
      this.logger.debug(`Searching with local embeddings: "${query}"`);

      // TODO: Generate query embedding and compute similarities
      // const queryEmbedding = await this.embed(query);
      // if (!queryEmbedding) return [];

      // const scores: Array<{ pageId: string; score: number }> = [];
      // for (const [pageId, vector] of this.embeddings) {
      //   const score = this.cosineSimilarity(queryEmbedding, vector.embedding);
      //   scores.push({ pageId, score });
      // }

      // return scores
      //   .sort((a, b) => b.score - a.score)
      //   .slice(0, topK);

      this.logger.debug('Semantic search placeholder (Phase 3)');
      return [];
    } catch (error) {
      this.logger.error(`Semantic search failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Compute cosine similarity between two vectors
   * TODO (Phase 3): Implement once embeddings available
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Clear embeddings cache
   */
  clear(): void {
    this.embeddings.clear();
    this.logger.debug('Embeddings cache cleared');
  }
}
