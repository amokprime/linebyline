function tst --description 'Run Playwright tests against the Vite build on the Server (filtered streaming output)'
    # Strip a leading `--` from argv so `tst -- --update-snapshots` works the
    # same as `tst --update-snapshots`. Without this, Playwright treats
    # `--update-snapshots` as a test filter (grep pattern) after the `--`
    # separator, and the flag is never applied.
    set -l args $argv
    if test (count $args) -gt 0; and test "$args[1]" = "--"
        set -l args $args[2..-1]
    end

    # Syncthing sync: trigger a rescan on the client, then poll the server
    # device's completion until 100%. This guarantees the working tree is up
    # to date on the server before running tests — even when tst is run
    # manually outside of deploy.sh.
    #
    # Required env vars (set in fish config):
    #   SYNCTHING_API_KEY    — Syncthing GUI API key
    #   SYNCTHING_LBL_ID     — LineByLine folder ID
    #   SYNCTHING_SERVER_ID  — Server device ID
    if set -q SYNCTHING_API_KEY; and set -q SYNCTHING_LBL_ID; and set -q SYNCTHING_SERVER_ID
        echo "tst: triggering Syncthing rescan..."
        curl -s -X POST -H "X-API-Key: $SYNCTHING_API_KEY" \
            "http://127.0.0.1:8384/rest/db/scan?folder=$SYNCTHING_LBL_ID" >/dev/null
        echo "tst: polling server completion..."
        for i in (seq 1 120)
            set pct (curl -s -H "X-API-Key: $SYNCTHING_API_KEY" \
                "http://127.0.0.1:8384/rest/db/completion?folder=$SYNCTHING_LBL_ID&device=$SYNCTHING_SERVER_ID" \
                | jq -r '.completion // 0' 2>/dev/null; or echo 0)
            if test "$pct" = "100"
                echo "tst: sync complete (100%)"
                break
            end
            if test (math $i % 10) -eq 0
                echo "tst: sync at $pct%..."
            end
            sleep 2
        end
    end

    ssh Server "LBL_VITE_TARGET=1 tst $args" 2>&1 | \
        grep -E "^\s+[0-9]+\) \[|Error:|Expected:|Received:|at /workspace/tests/|passed|failed|skipped|writing actual|does not match"
    notify-send "Tests done."
end
