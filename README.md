# latex-begin-end-auto-rename README

This extension aims to provide a feature that automatically renames the corresponding `\begin{}` and `\end{}` tags in LaTeX files.

# Usages

<img src="https://github.com/wxhenry/latex-begin-end-auto-rename/raw/main/images/display.gif" alt="demo of preview feature" width="350" />

# Note

- This extension will only work on `.tex` files.

- This extension will stop working if the numbers of `\begin{}` and `\end{}` tags are not equal.

# Known Issues

- This extension will also work on comments. For example, if you have a comment like `% \begin{document}`, this extension will still try to rename it.

<!-- 当begin在与之“匹配“的end之后时可能会出现问题 -->

- When the `\begin{}` tag is after the "corresponding" `\end{}` tag, this extension may not work properly.
