export interface GitCommit {
  hash: string;
  message: string;
}

export function parseGitLog(output: string): GitCommit[] {
  if (!output.trim()) return [];

  return output.trim().split("\n").map((line) => {
    const spaceIdx = line.indexOf(" ");
    if (spaceIdx === -1) return { hash: line, message: "" };
    return {
      hash: line.slice(0, spaceIdx),
      message: line.slice(spaceIdx + 1),
    };
  });
}
