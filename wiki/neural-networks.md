---
title: Neural Networks Overview
aliases: ["neural networks", "deep learning", "NN"]
tags: ["machine-learning", "neural-networks", "architecture"]
created: 2026-04-14T12:00:00Z
modified: 2026-04-14T12:00:00Z
source: "sample-neural-networks.txt"
---

# Neural Networks: A Comprehensive Overview

Neural networks are computational models inspired by biological neural networks. They consist of interconnected nodes (neurons) that process information using connectionist approaches to computation.

## Key Components

### Neurons
Artificial neurons are the fundamental units of neural networks. Each neuron receives weighted inputs, applies an activation function, and produces an output signal.

### Activation Functions
Common activation functions include:
- **ReLU**: max(0, x) - popular in deep networks
- **Sigmoid**: 1/(1+e^-x) - squashes output to [0,1]
- **Tanh**: range [-1,1]
- **Linear**: identity function

### Backpropagation
The fundamental algorithm for training neural networks. It computes gradients of the loss function with respect to weights using the chain rule.

## Architecture Types

### Feedforward Networks
Simple networks where information flows in one direction from input to output.

### Convolutional Neural Networks (CNNs)
Specialized for image processing. Detect local patterns (edges, textures, shapes).

### Recurrent Neural Networks (RNNs)
Process sequential data like text or time series. Hidden state maintains context.

### [[Transformers]]
Recent architecture using self-attention mechanisms. State-of-the-art in NLP and vision.

## Training Optimization

### Gradient Descent
Updates weights in direction opposite to gradient of loss function.

### Stochastic Gradient Descent (SGD)
Uses mini-batches instead of entire dataset.

### Adam Optimizer
Combines adaptive learning rates with momentum.

## Applications

- **Computer Vision**: Image classification, detection, segmentation
- **Natural Language Processing**: Text classification, machine translation
- **Reinforcement Learning**: Game playing, robotics control
