### Fedora 44
1. Pull the official Microsoft Playwright Podman image
```sh
podman pull mcr.microsoft.com/playwright:v1.61.0-noble
```

2. Run from repo folder root
```sh
# Headless
podman run --rm -it --userns=keep-id \
	-v $PWD:/workspace:z -w /workspace \
	-e HOME=/tmp \
	-e PW_CONTAINER=1 \
	mcr.microsoft.com/playwright:v1.61.0-noble \
	npx playwright test
  
# Onetime setup: Allow the container's UID to talk to your Wayland socket
xhost +SI:localuser:$(whoami)

# UI mode
podman run --rm -it --userns=keep-id --security-opt label=disable \
	--net=host --ipc=host \
	-e DISPLAY=$DISPLAY -e WAYLAND_DISPLAY=$WAYLAND_DISPLAY \
	-e XDG_RUNTIME_DIR=/tmp \
	-v $XDG_RUNTIME_DIR/$WAYLAND_DISPLAY:/tmp/$WAYLAND_DISPLAY:z \
	-v $XDG_RUNTIME_DIR/pipewire-0:/tmp/pipewire-0:z \
	-v $PWD:/workspace:z -w /workspace \
	-e HOME=/tmp \
	-e PW_CONTAINER=1 \
	mcr.microsoft.com/playwright:v1.61.0-noble \
	npx playwright test --ui
```

3. Or run with Fish functions
```sh
# Setup
function tst
    podman run --rm -it --userns=keep-id \
        -v $PWD:/workspace:z -w /workspace \
        -e HOME=/tmp \
        -e PW_CONTAINER=1 \
        mcr.microsoft.com/playwright:v1.61.0-noble \
        npx playwright test $argv
end

function tsta
    podman run --rm -it --userns=keep-id --security-opt label=disable \
        --net=host --ipc=host \
        -e DISPLAY=$DISPLAY -e WAYLAND_DISPLAY=$WAYLAND_DISPLAY \
        -e XDG_RUNTIME_DIR=/tmp \
        -v $XDG_RUNTIME_DIR/$WAYLAND_DISPLAY:/tmp/$WAYLAND_DISPLAY:z \
        -v $XDG_RUNTIME_DIR/pipewire-0:/tmp/pipewire-0:z \
        -v $PWD:/workspace:z -w /workspace \
        -e HOME=/tmp \
        -e PW_CONTAINER=1 \
        mcr.microsoft.com/playwright:v1.61.0-noble \
        npx playwright test --ui $argv
end

funcsave tst
funcsave tsta
# Usage examples: tst, tsta, tst tests/fields-merge.spec.js --project firefox
```