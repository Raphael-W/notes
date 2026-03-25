function parseMarkdown(rawText) {

  function parseGreaterLine(line) {

    function matchToObj(matchArr, typeText, args) {
      if (args.includes("indent") && args.includes("value")) {
        return { type: typeText, indent: matchArr[1].length, value: matchArr[2], content: matchArr[3] }
      }
      else if (args.includes("indent")) {
        return { type: typeText, indent: matchArr[1].length, content: matchArr[2] }
      }
      else {
        return { type: typeText, indent: 0, content: matchArr[1] }
      }
    }

    const PATTERNS = [
      ["h1", /^# (.*)/, []],
      ["h2", /^## (.*)/, []],
      ["h3", /^### (.*)/, []],
      ["h4", /^#### (.*)/, []],
      ["h5", /^##### (.*)/, []],
      ["h6", /^###### (.*)/, []],
      ["hr", /^---/, []],
      ["ul", /^(\t*)- (.*)/, ['indent']],
      ["ol", /^(\t*)([0-9]+)\. (.*)/, ['indent', 'value']]]

    for (const pattern of PATTERNS) {
      const match = line.match(pattern[1]);
      if (match) return matchToObj(match, pattern[0], pattern[2]);
    }

    return {type: "p", indent: 0, content: line};
  }

  function renderInnerLine(line) {
    let renderedLine = line.toString();

    const PATTERNS = [
      ["strong", /\*\*(.+?)\*\*/g],
      ["em", /\*(.+?)\*/g],
      ["u", /_(.+?)_/g],
      ["s", /~~(.+?)~~/g],
      ["mark", /==(.+?)==/g]]

    for (const pattern of PATTERNS) {
      renderedLine = renderedLine.replace(pattern[1], (_, content) => `<${pattern[0]}>${content}</${pattern[0]}>`)
    }
    return renderedLine;
  }

  const parsed = [];
  const textSplit = rawText.split("\n");

  for (const line of textSplit) {
    parsed.push(parseGreaterLine(renderInnerLine(line)));
  }
  return parsed;
}

function renderMarkdown(parsedMarkdown) {
  let outputHTML = "";
  let currentSection = "";
  let currentIndent = 0;

  for (const line of parsedMarkdown) {
    //Close ol/ul tags to decrease indent
    while (line.indent > currentIndent) {
      outputHTML += `<${currentSection}>\n`;
      currentIndent++;
    }

    //Open ol/ul tags to increase indent
    while (line.indent < currentIndent) {
      outputHTML += `</${currentSection}>\n`;
      currentIndent--;
    }

    //Close ul/ol tags if new line is different
    if ((currentSection !== line.type) && (["ul", "ol"].includes(currentSection))) {
      outputHTML += `</${currentSection}>\n`;
      currentSection = "";
    }

    //Add simple <hr> tag (no closing)
    if (line.type === "hr") {
      outputHTML += "<hr>\n";
      continue;
    }

    if (["ul", "ol"].includes(line.type)) {
      //Close previous "section" (e.g. ul/ol)
      if ((currentSection !== line.type)) {
        if (currentSection !== "") {
          outputHTML += `</${currentSection}>\n`;
        }
        outputHTML += `<${line.type}>\n`;
        currentSection = line.type;
      }

      if (line.type === "ul") {
        outputHTML += `<li>${line.content}</li>`;
      }
      else if (line.type === "ol") {
        outputHTML += `<li value="${line.value}">${line.content}</li>`;
      }
    }
    else {
      outputHTML += `<${line.type}>${line.content}</${line.type}>`;
    }

    outputHTML += "\n";
  }

  while (currentIndent > 0) {
      outputHTML += `</${currentSection}>\n`;
      currentIndent--;
  }

  return outputHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  const textArea = document.getElementById('rawText');
  const mdDiv = document.getElementById('md');

  function updateMD() {
    mdDiv.innerHTML = renderMarkdown(parseMarkdown(textArea.value));
  }

  textArea.addEventListener('input', () => {
      updateMD();
  });

  textArea.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();

      const start = textArea.selectionStart;
      const lineStart = textArea.value.lastIndexOf("\n", start - 1) + 1;

      if (e.shiftKey) {
        if (textArea.value[lineStart] === "\t") {
          textArea.value = textArea.value.substring(0, lineStart) + textArea.value.substring(lineStart + 1);
          textArea.selectionStart = textArea.selectionEnd = start - 1;
        }
      } else {
        textArea.value = textArea.value.substring(0, lineStart) + "\t" + textArea.value.substring(lineStart);
        textArea.selectionStart = textArea.selectionEnd = start + 1;
      }
      updateMD();
    }
  });
})