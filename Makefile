compile:
	deno compile --unstable main.ts

run:
	./run

compile_and_run:
	deno compile --unstable main.ts && ./treasure

compile_aarch64_apple:
	deno compile --unstable --output ./dist/treasure-aarch64 --target aarch64-apple-darwin main.ts

compile_x86_64_apple:
	deno compile --unstable --output ./dist/treasure-x86_64 --target x86_64-apple-darwin main.ts

compile_for_windows:
	deno compile --unstable --output ./dist/treasure-windows --target x86_64-pc-windows-msvc main.ts

compile_for_linux:
	deno compile --unstable --output ./dist/treasure-linux --target x86_64-unknown-linux-gnu main.ts

compile_for_all_targets: compile_aarch64_apple compile_x86_64_apple compile_for_windows compile_for_linux

