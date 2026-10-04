function tst --description 'Run Playwright tests on the Server (bare ssh wrapper)'
    # The server's `tst` bash script (staged at linebyline/scripts/tst, symlinked
    # to ~/.local/bin/tst) now handles ALL the pre/post-test logic:
    #   - Syncthing sync (auto-detects API key from the server's own Syncthing
    #     config XML — no env vars needed for a bare `ssh Server tst`)
    #   - LBL_VITE_TARGET=1 (hardcoded in the server script)
    #   - trash/ cleanup before the run
    #   - Pulling trash/ artifacts via scratch/upload/ after failures
    #
    # So the client tst.fish is just a bare `ssh Server tst` wrapper.
    # All args pass through to the server's tst → npx playwright test.
    #
    # Output filter: drop the verbose [N/M] [browser] progress lines, keep
    # everything else (failures, summary, errors, tst: messages).
    ssh Server tst $argv 2>&1 | \
        grep -E "^\s+[0-9]+\) \[|Error:|Expected:|Received:|at /workspace/tests/|passed|failed|skipped|writing actual|does not match|tst:|WARNING"
    notify-send "Tests done."
end
