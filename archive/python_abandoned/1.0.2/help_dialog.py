"""LineByLine – help_dialog.py  [STUB]"""
from PySide6.QtWidgets import QDialog, QVBoxLayout, QTextBrowser
from pathlib import Path

class HelpDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Help")
        self.resize(720, 560)
        browser = QTextBrowser()
        md_path = Path(__file__).parent / "HELP.md"
        if md_path.exists():
            browser.setMarkdown(md_path.read_text(encoding="utf-8"))
        else:
            browser.setPlainText("HELP.md not found.")
        lay = QVBoxLayout(self)
        lay.addWidget(browser)
