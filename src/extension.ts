"use strict";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let symbols: vscode.DocumentSymbol[] = [];
  let dirtyTree = true;
  const root = { children: symbols };

  const refreshSymbols = async (editor: vscode.TextEditor) => {
    if (dirtyTree || symbols.length === 0) {
      symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        "vscode.executeDocumentSymbolProvider",
        editor.document.uri
      );
      root.children = symbols;
    }
  };

  const activeEditorChangeListener = vscode.window.onDidChangeActiveTextEditor(
    (e) => {
      dirtyTree = true;
      symbols = [];
    }
  );

  const documentChangeListener = vscode.workspace.onDidChangeTextDocument(
    (e) => {
      dirtyTree = true;
      symbols = [];
    }
  );

  function findSymbolAtPositionWithParent(
    symbols: vscode.DocumentSymbol[],
    position: vscode.Position,
    parentSymbol:
      | vscode.DocumentSymbol
      | undefined
      | { children: vscode.DocumentSymbol[] }
  ): {
    parentSymbol:
      | vscode.DocumentSymbol
      | undefined
      | { children: vscode.DocumentSymbol[] };
    childSymbol: vscode.DocumentSymbol | undefined;
  } {
    for (const symbol of symbols) {
      if (symbol.range.contains(position)) {
        if (symbol.children.length > 0) {
          const { parentSymbol: newParentSymbol, childSymbol } =
            findSymbolAtPositionWithParent(symbol.children, position, symbol);
          if (childSymbol) {
            return { parentSymbol: newParentSymbol, childSymbol };
          } else {
            return { parentSymbol, childSymbol: symbol };
          }
        }
        return { parentSymbol, childSymbol: symbol };
      }
    }
    return { parentSymbol, childSymbol: undefined };
  }
  function findParentSymbol(
    symbols: vscode.DocumentSymbol[],
    target: vscode.DocumentSymbol
  ): vscode.DocumentSymbol | undefined {
    for (const symbol of symbols) {
      if (symbol.children.includes(target)) {
        return symbol;
      }
      const parent = findParentSymbol(symbol.children, target);
      if (parent) {
        return parent;
      }
    }
    return undefined;
  }
  function getFirstChild(
    symbol: vscode.DocumentSymbol,
    parentSymbol: vscode.DocumentSymbol | { children: vscode.DocumentSymbol[] }
  ): vscode.DocumentSymbol {
    if (symbol.children.length > 0) {
      const children = symbol.children.sort(sort);
      return children[0];
    } else {
      return getSibling(symbol, parentSymbol, true);
    }
  }
  const sort = (a: vscode.DocumentSymbol, b: vscode.DocumentSymbol) => {
    if (a.range.start.line === b.range.start.line) {
      return a.range.start.character - b.range.start.character;
    }
    return a.range.start.line - b.range.start.line;
  };
  function getSibling(
    symbol: vscode.DocumentSymbol,
    parent: vscode.DocumentSymbol | { children: vscode.DocumentSymbol[] },
    next: boolean
  ): vscode.DocumentSymbol {
    const children = parent.children.sort(sort);

    const index = children.indexOf(symbol);

    if (next) {
      if (index + 1 < children.length) {
        return children[index + 1];
      } else if ("range" in parent) {
        const grandParent = findParentSymbol(symbols, parent);
        if (grandParent && "range" in grandParent) {
          return getSibling(parent, grandParent, true);
        }
      }
    } else {
      if (index - 1 >= 0) {
        return children[index - 1];
      } else if ("range" in parent) {
        return parent;
      }
    }
    return symbol;
  }
  function goToSymbol(
    editor: vscode.TextEditor,
    symbol: vscode.DocumentSymbol
  ) {
    const position = symbol.range.start;
    const newSelection = new vscode.Selection(position, position);
    editor.selection = newSelection;
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );
  }

  const nextMemberCommand = vscode.commands.registerTextEditorCommand(
    "gotoMember.next",
    async (editor: vscode.TextEditor) => {
      await refreshSymbols(editor);
      if (symbols.length === 0) {
        return;
      }
      const { parentSymbol, childSymbol } = findSymbolAtPositionWithParent(
        symbols,
        editor.selection.active,
        root
      );
      if (!childSymbol || !parentSymbol) {
        return;
      }
      const siblingSymbol = getSibling(childSymbol, parentSymbol, true);

      goToSymbol(editor, siblingSymbol);
      vscode.window.setStatusBarMessage("Next Member", 1000);
    }
  );
  const previousMemberCommand = vscode.commands.registerTextEditorCommand(
    "gotoMember.previous",
    async (editor: vscode.TextEditor) => {
      await refreshSymbols(editor);
      if (symbols.length === 0) {
        return;
      }
      const { parentSymbol, childSymbol } = findSymbolAtPositionWithParent(
        symbols,
        editor.selection.active,
        root
      );
      if (!childSymbol || !parentSymbol) {
        return;
      }
      const siblingSymbol = getSibling(childSymbol, parentSymbol, false);

      goToSymbol(editor, siblingSymbol);
      vscode.window.setStatusBarMessage("Previous Member", 1000);
    }
  );
  const parentMemberCommand = vscode.commands.registerTextEditorCommand(
    "gotoMember.parent",
    async (editor: vscode.TextEditor) => {
      await refreshSymbols(editor);
      if (symbols.length === 0) {
        return;
      }
      const { parentSymbol, childSymbol } = findSymbolAtPositionWithParent(
        symbols,
        editor.selection.active,
        root
      );
      if (!parentSymbol) {
        return;
      } else if (!("range" in parentSymbol) && childSymbol) {
        const newParentSymbol = getSibling(childSymbol, parentSymbol, false);
        if (newParentSymbol) {
          goToSymbol(editor, newParentSymbol);
        }
      } else if ("range" in parentSymbol) {
        goToSymbol(editor, parentSymbol);
      }

      vscode.window.setStatusBarMessage("Parent Member", 1000);
    }
  );

  const childMemberCommand = vscode.commands.registerTextEditorCommand(
    "gotoMember.child",
    async (editor: vscode.TextEditor) => {
      await refreshSymbols(editor);
      if (symbols.length === 0) {
        return;
      }
      const { parentSymbol, childSymbol } = findSymbolAtPositionWithParent(
        symbols,
        editor.selection.active,
        root
      );
      if (!childSymbol || !parentSymbol) {
        return;
      }
      const firstChild = getFirstChild(childSymbol, parentSymbol);

      goToSymbol(editor, firstChild);
      vscode.window.setStatusBarMessage("Child Member", 1000);
    }
  );

  context.subscriptions.push(
    previousMemberCommand,
    nextMemberCommand,
    parentMemberCommand,
    childMemberCommand,
    documentChangeListener,
    activeEditorChangeListener
  );
}
