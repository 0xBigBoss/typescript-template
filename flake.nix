{
  description = "TypeScript project template";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    nixpkgs-unstable.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    bun-overlay = {
      url = "github:0xbigboss/bun-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };
    tilt-overlay = {
      url = "github:0xbigboss/tilt-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # Used for shell.nix
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
  };

  outputs = {
    self,
    nixpkgs,
    nixpkgs-unstable,
    flake-utils,
    bun-overlay,
    tilt-overlay,
    ...
  } @ inputs: let
    overlays = [
      bun-overlay.overlays.default
      tilt-overlay.overlays.default
      (final: prev: {
        unstable = import nixpkgs-unstable {
          inherit (prev) system;
          overlays = [
            bun-overlay.overlays.default
            tilt-overlay.overlays.default
          ];
          config = {
            allowUnfree = true;
          };
        };
      })
    ];

    systems = ["x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin"];
  in
    flake-utils.lib.eachSystem systems (
      system: let
        pkgs = import nixpkgs {
          inherit overlays system;
          config = {
            allowUnfree = true;
          };
        };
      in {
        formatter = pkgs.alejandra;

        devShells.default = pkgs.mkShell {
          name = "ts-dev";
          nativeBuildInputs = [
            pkgs.bun
            pkgs.unstable.fnm
            pkgs.unstable.jq
            pkgs.unstable.ripgrep
            pkgs.unstable.coreutils
            pkgs.unstable.tilt
            pkgs.unstable.lefthook
          ];
          shellHook =
            ''
              eval "$(fnm env --use-on-cd --corepack-enabled --shell bash)"
            ''
            + (pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
              export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
            '')
            + (pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isDarwin ''
              unset SDKROOT
              unset DEVELOPER_DIR
              export PATH=/usr/bin:$PATH
            '');
        };

        devShell = self.devShells.${system}.default;
      }
    );
}
