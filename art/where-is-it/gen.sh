#!/bin/zsh
# gen.sh <out-name> <brief-file> [ref images...]  -> <this folder>/<out-name>.png
# Run from this folder (ref paths are relative to it). See PROMPTS.md.
# out-name may include a folder: refs/R1-chair or drafts/M1-chair
set -e
name=$1; brief=$2; shift 2
A=${0:A:h}  # this folder
out=$A/$name.png
imgs=(); for f in "$@"; do imgs+=(-i "$f"); done
task="Generate exactly ONE image with your built-in image generation tool, from the brief below. Then copy that generated PNG to this exact path: $out . Do not create, edit or delete any other file. Do not write any code to draw the image yourself.

BRIEF:
$(cat $brief)"
/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex exec --ephemeral -c model_reasoning_effort='"low"' --skip-git-repo-check -s workspace-write -C $A "${imgs[@]}" -- "$task" < /dev/null > $A/drafts/.log-${name//\//_}.txt 2>&1 || true
if [[ -f $out ]]; then echo "OK $out $(magick identify -format '%wx%h' $out)"; else echo "MISSING $out"; tail -20 $A/drafts/.log-${name//\//_}.txt; fi
grep -iE "tokens used" -A1 $A/drafts/.log-${name//\//_}.txt | tail -1
