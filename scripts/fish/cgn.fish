function cgn --description 'Playwright Codegen against the Vite build'
    cd ~/GitHub/linebyline

    # vite preview requires dist/ — build if missing
    if not test -d dist
        echo "cgn: building dist/ first…"
        npm run build
    end

    set -l need_cleanup false

    # Ensure Vite preview server is running on port 5173
    if not curl -s -o /dev/null -w '' http://localhost:5173/linebyline/ 2>/dev/null
        echo "cgn: starting Vite preview on :5173 …"
        npx vite preview --port 5173 --strictPort >/dev/null 2>&1 &
        set need_cleanup true
        # Wait up to 5s for it to be ready
        for i in (seq 1 20)
            if curl -s -o /dev/null -w '' http://localhost:5173/linebyline/ 2>/dev/null
                break
            end
            sleep 0.25
        end
    end

    # Vite preview serves at /linebyline/ (base config for GitHub Pages project URL)
    npx playwright codegen "http://localhost:5173/linebyline/" $argv

    # Kill the server we started; leave pre-existing ones alone
    if test "$need_cleanup" = true
        fuser -k 5173/tcp 2>/dev/null; or true
    end
end
