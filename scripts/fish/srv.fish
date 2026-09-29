function srv --description 'Start Vite preview server for manual testing (MANUAL.md)'
    cd ~/GitHub/linebyline

    # vite preview requires dist/ — build if missing
    if not test -d dist
        echo "srv: building dist/ first…"
        npm run build
    end

    set -l url "http://localhost:5173/linebyline/"

    # Check if server is already running on 5173
    if curl -s -o /dev/null -w '' $url 2>/dev/null
        echo "srv: Vite preview already running on $url"
        echo "srv: Opening in default browser…"
        xdg-open $url >/dev/null 2>&1 &
        return 0
    end

    echo "srv: starting Vite preview on $url"
    # Start server in background, poll until ready, then open browser
    npx vite preview --port 5173 --strictPort >/dev/null 2>&1 &
    set -l srv_pid (jobs -p | tail -1)

    # Poll up to 10s for the server to be ready
    for i in (seq 1 40)
        if curl -s -o /dev/null -w '' $url 2>/dev/null
            echo "srv: server ready, opening in default browser…"
            xdg-open $url >/dev/null 2>&1 &
            # Bring the server to foreground so Ctrl+C stops it
            wait $srv_pid
            return $status
        end
        sleep 0.25
    end

    echo "srv: WARNING — server didn't become ready in 10s, opening browser anyway"
    xdg-open $url >/dev/null 2>&1 &
    wait $srv_pid
end
