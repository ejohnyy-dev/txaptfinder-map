#!/usr/bin/env python3
"""Heuristic complexity scanner: long functions, deep nesting, long files."""
import os, re, sys

ROOTS = ["client", "server", "shared", "drizzle"]
EXCLUDE_DIRS = {"node_modules", "dist", "build", ".git", "coverage", ".next", "out", ".claude"}
EXTS = (".ts", ".tsx", ".js", ".jsx")

def is_excluded(path):
    parts = set(path.split(os.sep))
    if parts & EXCLUDE_DIRS:
        return True
    if path.endswith(".d.ts") or path.endswith(".min.js"):
        return True
    return False

func_re = re.compile(
    r'^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?'
    r'(?:function\s+\w+|(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\(|'
    r'\w+\s*[:=]\s*(?:async\s*)?\([^)]*\)\s*(?::[^=]+)?=>|'
    r'(?:public|private|protected|static|async|\s)*\w+\s*\([^)]*\)\s*\{)'
)

findings = []

def indent_depth(line):
    stripped = line.lstrip(" \t")
    lead = line[:len(line)-len(stripped)]
    return lead.replace("\t", "  ").count("  ")

for root in ROOTS:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fn in filenames:
            if not fn.endswith(EXTS):
                continue
            path = os.path.join(dirpath, fn)
            if is_excluded(path):
                continue
            try:
                lines = open(path, encoding="utf-8", errors="replace").read().splitlines()
            except Exception:
                continue
            nlines = len(lines)
            if nlines > 400:
                findings.append((nlines, f"{path}:1 — file is {nlines} lines (>400)"))
            # nesting depth via brace counting
            depth = 0
            maxdepth = 0
            maxdepth_line = 0
            for i, ln in enumerate(lines, 1):
                code = re.sub(r'//.*', '', ln)
                opens = code.count("{")
                closes = code.count("}")
                if opens > closes and depth + (opens-closes) > maxdepth:
                    maxdepth = depth + (opens-closes)
                    maxdepth_line = i
                depth += opens - closes
                if depth < 0:
                    depth = 0
            if maxdepth > 5:  # account for top-level wrappers; >4 logical roughly maps here
                findings.append((maxdepth*100, f"{path}:{maxdepth_line} — brace-nesting depth {maxdepth} (>5)"))
            # long functions via brace matching from a function-looking line
            i = 0
            while i < len(lines):
                ln = lines[i]
                if func_re.search(ln) and "{" in ln:
                    depth_f = ln.count("{") - ln.count("}")
                    if depth_f <= 0:
                        i += 1
                        continue
                    start = i
                    j = i + 1
                    while j < len(lines) and depth_f > 0:
                        c = re.sub(r'//.*', '', lines[j])
                        depth_f += c.count("{") - c.count("}")
                        j += 1
                    length = j - start
                    if length > 60:
                        findings.append((length, f"{path}:{start+1} — function spans {length} lines (>60)"))
                    i = j
                else:
                    i += 1

findings.sort(key=lambda x: -x[0])
seen = set()
out = []
for score, msg in findings:
    if msg in seen:
        continue
    seen.add(msg)
    out.append(msg)
for m in out[:20]:
    print(m)
