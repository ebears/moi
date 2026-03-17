export interface DiffLine {
  type: "add" | "remove" | "context" | "header" | "hunk";
  leftNum?: number;
  rightNum?: number;
  leftContent?: string;
  rightContent?: string;
  content: string;
}

export function parseUnifiedDiff(diff: string): DiffLine[] {
  const lines = diff.split("\n");
  const result: DiffLine[] = [];
  let leftLineNum = 0;
  let rightLineNum = 0;

  for (const line of lines) {
    if (line.startsWith("---") || line.startsWith("+++")) {
      result.push({ type: "header", content: line });
    } else if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        leftLineNum = parseInt(match[1] as string, 10);
        rightLineNum = parseInt(match[2] as string, 10);
      }
      result.push({ type: "hunk", content: line });
    } else if (line.startsWith("-")) {
      result.push({
        type: "remove",
        leftNum: leftLineNum++,
        content: line.slice(1),
      });
    } else if (line.startsWith("+")) {
      result.push({
        type: "add",
        rightNum: rightLineNum++,
        content: line.slice(1),
      });
    } else {
      result.push({
        type: "context",
        leftNum: leftLineNum++,
        rightNum: rightLineNum++,
        content: line.startsWith(" ") ? line.slice(1) : line,
      });
    }
  }

  return result;
}

export interface SideBySideLine {
  leftNum?: number;
  leftContent?: string;
  leftType?: "remove" | "context";
  rightNum?: number;
  rightContent?: string;
  rightType?: "add" | "context";
  isHunk?: boolean;
  isHeader?: boolean;
}

export function parseSideBySide(lines: DiffLine[]): SideBySideLine[] {
  const result: SideBySideLine[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (line.type === "header") {
      result.push({ isHeader: true, leftContent: line.content, rightContent: line.content });
      i++;
      continue;
    }

    if (line.type === "hunk") {
      result.push({ isHunk: true, leftContent: line.content, rightContent: line.content });
      i++;
      continue;
    }

    if (line.type === "context") {
      result.push({
        leftNum: line.leftNum,
        leftContent: line.content,
        leftType: "context",
        rightNum: line.rightNum,
        rightContent: line.content,
        rightType: "context",
      });
      i++;
      continue;
    }

    if (line.type === "remove") {
      // Check if next line is an add (modified line pair)
      const nextLine = i + 1 < lines.length ? lines[i + 1] : undefined;
      if (nextLine && nextLine.type === "add") {
        result.push({
          leftNum: line.leftNum,
          leftContent: line.content,
          leftType: "remove",
          rightNum: nextLine.rightNum,
          rightContent: nextLine.content,
          rightType: "add",
        });
        i += 2;
        continue;
      }
      // Just a removal
      result.push({
        leftNum: line.leftNum,
        leftContent: line.content,
        leftType: "remove",
      });
      i++;
      continue;
    }

    if (line.type === "add") {
      result.push({
        rightNum: line.rightNum,
        rightContent: line.content,
        rightType: "add",
      });
      i++;
      continue;
    }

    i++;
  }

  return result;
}
