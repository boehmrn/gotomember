"use strict";
import { dir } from "console";
import { isDataView } from "util/types";
import * as vscode from "vscode";
type Root = { children: vscode.DocumentSymbol[] };
function format(str: string | number, length = 20) {
  str = str.toString();
  if (str.length > length) {
    // String kürzen, wenn er zu lang ist
    return str.substring(0, length);
  } else {
    // String mit Leerzeichen auffüllen, wenn er zu kurz ist
    return str.padEnd(length);
  }
}
export function activate(context: vscode.ExtensionContext) {
  const log = (string?: string | number) => {
    const naw = new Date().getTime();
    const diff = naw - now;
    console.log(format(diff.toString()), format(string || ""), int++);
  };
  let symbols: vscode.DocumentSymbol[] = [];
  let int = 0;
  let now = new Date().getTime();
  let dirtyTree = true;
  const root: Root = { children: [] };

  const refreshSymbols = async (editor: vscode.TextEditor) => {
    if (dirtyTree || symbols.length === 0) {
      symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        "vscode.executeDocumentSymbolProvider",
        editor.document.uri
      );
      if (symbols) {
        symbols = symbols.sort(sort);
        root.children = symbols;
      }
      dirtyTree = false;
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
  function isBetweenSymbols(
    position: vscode.Position,
    symbols: vscode.DocumentSymbol[],
    index: number,
    before?: boolean
  ) {
    if (before) {
      const symbol = symbols[index];
      if (index === 0) {
        return symbol.range.contains(position);
      } else {
        const symbol2 = symbols[index - 1];
        return (
          symbol.range.end.isAfter(position) &&
          symbol2.range.end.isBeforeOrEqual(position)
        );
      }
    } else {
      const symbol = symbols[index];
      if (index === symbols.length - 1) {
        return symbol.range.contains(position);
      }
      const symbol2 = symbols[index + 1];
      return (
        symbol.range.start.isBeforeOrEqual(position) &&
        symbol2.range.start.isAfter(position)
      );
    }
  }
  function findSymbolIndex(
    position: vscode.Position,
    symbols: vscode.DocumentSymbol[],
    before?: boolean
  ) {
    if (before) {
      return symbols.findIndex((symbol) => symbol.range.end.isAfter(position));
    } else {
      const index = [...symbols]
        .reverse()
        .findIndex((symbol) => symbol.range.start.isBeforeOrEqual(position));

      return index === -1 ? index : symbols.length - index - 1;
    }
  }
  function isInRange(
    position: vscode.Position,
    symbols: vscode.DocumentSymbol[]
  ) {
    return (
      symbols.at(0)?.range.start.isBeforeOrEqual(position) &&
      symbols.at(-1)?.range.end.isAfter(position)
    );
  }

  function findSymbolAtPositionWithParent(
    position: vscode.Position,
    parentSymbol: vscode.DocumentSymbol | Root = root,
    before?: boolean
  ): {
    parentSymbol: vscode.DocumentSymbol | Root;
    childSymbol?: vscode.DocumentSymbol;
    included: boolean;
    index: number;
  } {
    if (!parentSymbol.children?.length) {
      return {
        parentSymbol,
        included: false,
        index: -1,
      };
    }
    parentSymbol.children = parentSymbol.children.sort(sort);
    const index = findSymbolIndex(position, parentSymbol.children, before);
    if (
      index === -1 ||
      !parentSymbol.children[index].range.contains(position)
    ) {
      return {
        parentSymbol,
        included: false,
        index,
      };
    } else if (
      parentSymbol.children[index].range.start.isEqual(position) ||
      !parentSymbol.children[index].children.length
    ) {
      return {
        parentSymbol,
        included: true,
        index,
      };
    } else {
      return findSymbolAtPositionWithParent(
        position,
        parentSymbol.children[index],
        before
      );
    }
  }
  function findParentSymbol(
    parent: vscode.DocumentSymbol | Root,
    symbol: vscode.DocumentSymbol
  ): vscode.DocumentSymbol | Root | undefined {
    for (const child of parent.children) {
      if (child === symbol) {
        return parent;
        break;
      } else {
        const newParent = findParentSymbol(child, symbol);
        if (newParent) {
          return newParent;
        }
      }
    }
  }
  function getFirstChild(
    symbol: vscode.DocumentSymbol,
    parentSymbol: vscode.DocumentSymbol | Root,
    first?: boolean
  ): vscode.DocumentSymbol | undefined {
    if (symbol.children.length > 0) {
      const children = symbol.children.sort(sort);
      return children[0];
    } else {
      if (first) {
      }
    }
  }
  const sort = (a: vscode.DocumentSymbol, b: vscode.DocumentSymbol) => {
    if (a.range.start.line === b.range.start.line) {
      return a.range.start.character - b.range.start.character;
    }
    return a.range.start.line - b.range.start.line;
  };
  function goToSymbol(
    editor: vscode.TextEditor,
    symbol: vscode.DocumentSymbol
  ) {
    const position = symbol.range.start;
    const newSelection = new vscode.Selection(position, position);
    editor.selection = newSelection;
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.Default
    );
  }

  const nextMemberCommand = vscode.commands.registerTextEditorCommand(
    "gotoMember.next",
    async (editor: vscode.TextEditor) => {
      now = new Date().getTime();
      await refreshSymbols(editor);
      const position = editor.selection.active;
      const { parentSymbol, included, index } = findSymbolAtPositionWithParent(
        position,
        root,
        true
      );
      if (index === -1 || index === parentSymbol.children.length - 1) {
        return;
      }
      if (!included) {
        goToSymbol(editor, parentSymbol.children[index]);
      } else {
        goToSymbol(editor, parentSymbol.children[index + 1]);
      }
    }
  );
  const previousMemberCommand = vscode.commands.registerTextEditorCommand(
    "gotoMember.previous",
    async (editor: vscode.TextEditor) => {
      now = new Date().getTime();
      await refreshSymbols(editor);
      const position = editor.selection.active;
      const { parentSymbol, included, index } = findSymbolAtPositionWithParent(
        position,
        root,
        false
      );
      if (index === -1 || index === 0) {
        return;
      }
      if (!included) {
        goToSymbol(editor, parentSymbol.children[index]);
      } else {
        goToSymbol(editor, parentSymbol.children[index - 1]);
      }
    }
  );
  const parentMemberCommand = vscode.commands.registerTextEditorCommand(
    "gotoMember.parent",
    async (editor: vscode.TextEditor) => {
      now = new Date().getTime();
      await refreshSymbols(editor);

      const position = editor.selection.active;
      const { parentSymbol, included, index } = findSymbolAtPositionWithParent(
        position,
        root,
        false
      );
      if (index === -1) {
        return;
      }
      if (!("range" in parentSymbol)) {
        return;
      }

      goToSymbol(editor, parentSymbol);
    }
  );

  const childMemberCommand = vscode.commands.registerTextEditorCommand(
    "gotoMember.child",
    async (editor: vscode.TextEditor) => {
      now = new Date().getTime();
      await refreshSymbols(editor);
      if (symbols.length === 0) {
        return;
      }
      const position = editor.selection.active;
      let { parentSymbol, included, index } = findSymbolAtPositionWithParent(
        position,
        root,
        true
      );
      if (index === -1) {
        return;
      }
      if (!included) {
        goToSymbol(editor, parentSymbol.children[index]);
        return;
      }
      const newIndex = parentSymbol.children
        .slice(index)
        .findIndex((symbol) => {
          return symbol.children.length > 0;
        });
      if (newIndex === -1) {
        return;
      }

      goToSymbol(
        editor,
        parentSymbol.children[index + newIndex].children.sort(sort)[0]
      );
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
