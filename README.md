# Jump to Symbol Extension for VS Code

This README outlines the details of collaborating on the "Jump to Symbol" extension for Visual Studio Code. This extension provides an enhanced navigation experience by allowing users to quickly jump to various symbols within their code, such as functions, classes, or variables.

## Features

- **Navigate to Parent Symbol**: Quickly jump to the parent symbol of the current code context.
- **Navigate to Child Symbol**: Easily navigate to child symbols related to the current symbol.
- **Navigate to Previous/Next Symbol**: Seamlessly move between symbols in your code file with previous and next navigation commands.

## Requirements

This extension requires Visual Studio Code version 1.89.1 or higher. Ensure your development environment meets this requirement to utilize the extension effectively.

## Extension Settings

This extension contributes the following commands to the Command Palette:

- `gotoMember.previous`: Navigate to the previous symbol relative to the current cursor position.
- `gotoMember.next`: Navigate to the next symbol relative to the current cursor position.
- `gotoMember.parent`: Navigate to the parent symbol of the current symbol.
- `gotoMember.child`: Navigate to the first child symbol of the current symbol.

## Installation

To install the extension, follow these steps:

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the square icon on the sidebar or pressing `Ctrl+Shift+X`.
3. Search for "Jump to Symbol".
4. Click on the install button next to the extension.

## Usage

After installation, you can use the commands provided by the extension through the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac). Simply type the command name (e.g., "Navigate to Parent Symbol") and press Enter to execute it.

## Known Issues

Currently, there are no known issues. If you encounter any problems, please report them on the [GitHub repository](https://github.com/your-github-repo/jump-to-symbol-extension).

## Release Notes

### 1.0.0

Initial release of the Jump to Symbol extension.

- Added commands for navigating to parent, child, previous, and next symbols.

---

For more information on how to use and contribute to the Jump to Symbol extension, please visit the [GitHub repository](https://github.com/your-github-repo/jump-to-symbol-extension).

**Enjoy navigating your code more efficiently with the Jump to Symbol extension!**
