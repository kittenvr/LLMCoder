# LLMCoder

![](images/LLMCoder.png)

## What's it for

Paste in your source code, it generate line numbered source. With it's own Markdown diff format instruction, to guide LLM to generate the code modification. LLMCoder can then apply the changes to your source. You don't need to manually apply changes.

## Origin
Inspired from [hannesrudolph/llm-code-helper](https://github.com/hannesrudolph/llm-code-helper). Actually, code converted from it by the help of Claude 3.5 Sonnet, with only one prompt. From Python to pure html/css/js, for easy using.

Then I added auto focus, auto Format code/Process Changes after pasting, and auto clear. Fit whole page without scroll bar. Make the whole process even easier.

It's now using Markdown format, instead of original JSON. Not only saves more tokens, but avoid escape char problems like forgetting to use \\" in JSON. Easy reading the diff output, with better manual correction ability.

## Usage

Just clone this repo, and open the `index.html` file from your browser, you don't need Python or any installation.

Or you can open my page online: [LLM Coder](https://christorng.github.io/LLMCoder/). It runs purely on your browser, no data is sent to any server.

This repo is planning to integrated into [LLMCoderSync](https://github.com/ChrisTorng/LLMCoderSync), you can use them together now. Please reference to the README.md of [LLMCoderSync](https://github.com/ChrisTorng/LLMCoderSync).
