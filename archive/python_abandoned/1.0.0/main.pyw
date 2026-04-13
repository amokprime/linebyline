"""
LineByLine – main.py
Entry point.  Creates QApplication and MainWindow, then starts the event loop.
"""

import sys
from PySide6.QtWidgets import QApplication
from main_window import MainWindow


def main() -> None:
    app = QApplication(sys.argv)
    app.setApplicationName("LineByLine")
    app.setOrganizationName("LineByLine")
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
