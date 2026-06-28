# _plugins/math_protect.rb
#
# Protects LaTeX math ($...$ and $$...$$) from kramdown's markdown processing.
#
# Two problems occur without this plugin:
#   1. Underscores (_) inside $...$ → kramdown parses as markdown emphasis → <em> tags
#   2. Pipes (|) inside $...$    → kramdown parses as table cell separators
#
# Strategy:
#   Use a character-by-character state machine to find all $...$ spans, then:
#   - Replace | → Unicode Private Use Area placeholder (restored post-render)
#   - Wrap the span in {::nomarkdown}...{:/} (kramdown passes it through verbatim)
#
# The state-machine approach is 100% reliable — no regex edge cases with
# nested braces, newlines, or adjacent delimiters.

module MathProtect
  PIPE_PLACEHOLDER = ""  # U+E001 — won't appear in real content

  def self.pre_process(content)
    spans = find_math_spans(content)

    # Process spans in REVERSE order so byte positions stay valid
    spans.reverse_each do |open_pos, close_pos, display|
      inner = content[(open_pos + display)..(close_pos - display)]
      next if inner.nil? || inner.empty?

      # Replace | with placeholder (so they don't become table separators)
      fixed = inner.gsub('|', PIPE_PLACEHOLDER)

      # Build the wrapped span
      delim = display == 2 ? '$$' : '$'
      wrapped = "{::nomarkdown}#{delim}#{fixed}#{delim}{:/}"

      # Replace in content
      content[open_pos..close_pos] = wrapped
    end

    content
  end

  # Scan content character-by-character to find all $...$ and $$...$$ spans.
  # Returns array of [open_pos, close_pos, display] where display is 1 or 2.
  def self.find_math_spans(content)
    spans = []
    i = 0
    length = content.length

    while i < length
      c = content[i]

      if c == '$'
        # Check for display math $$
        if content[i + 1] == '$'
          # Find closing $$
          close_pos = content.index('$$', i + 2)
          if close_pos
            spans << [i, close_pos + 1, 2]  # close_pos points to first $ of closing $$
            i = close_pos + 2
          else
            i += 1  # unclosed $$, skip
          end
        else
          # Inline math $
          close_pos = content.index('$', i + 1)
          if close_pos
            spans << [i, close_pos, 1]
            i = close_pos + 1
          else
            i += 1  # unclosed $, skip
          end
        end
      else
        i += 1
      end
    end

    spans
  end

  def self.post_process(html)
    html.gsub(PIPE_PLACEHOLDER, '|')
  end
end

Jekyll::Hooks.register [:pages, :documents], :pre_render do |item|
  if item.respond_to?(:content) && item.content
    item.content = MathProtect.pre_process(item.content)
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_render do |item|
  if item.respond_to?(:output) && item.output
    item.output = MathProtect.post_process(item.output)
  end
end
