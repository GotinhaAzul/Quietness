#!/usr/bin/env bash
# Strip bundled Wayland libraries from Tauri AppImages.
# Workaround for EGL_BAD_PARAMETER on Arch/Omarchy where the Ubuntu-built
# libwayland-* conflicts with the host Mesa/Wayland stack.
# See https://github.com/GotinhaAzul/Quietness/issues/1
set -euo pipefail

echo "[fix-appimage] searching for AppImages under src-tauri/target..."

mapfile -t APPIMAGES < <(find src-tauri/target -type f -name "*.AppImage" 2>/dev/null || true)

if [ "${#APPIMAGES[@]}" -eq 0 ]; then
  echo "[fix-appimage] no AppImages found – nothing to fix"
  exit 0
fi

# Also clean any leftover AppDirs (linuxdeploy staging) so a manual repack
# would not re-introduce the libs even if repacking is skipped elsewhere.
mapfile -t APPDIRS < <(find src-tauri/target -type d -name "*.AppDir" 2>/dev/null || true)
for d in "${APPDIRS[@]}"; do
  echo "[fix-appimage] cleaning AppDir: $d"
  find "$d" -type f -name "libwayland*.so*" -print -delete 2>/dev/null || true
done

# Ensure appimagetool is available for repacking.
APPIMAGETOOL=""
if command -v appimagetool >/dev/null 2>&1; then
  APPIMAGETOOL="$(command -v appimagetool)"
else
  TMP_TOOL="/tmp/appimagetool"
  if [ ! -x "$TMP_TOOL" ]; then
    echo "[fix-appimage] downloading appimagetool..."
    if ! wget -q -O "$TMP_TOOL" "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage"; then
      echo "[fix-appimage] wget failed, trying curl..."
      curl -fsSL -o "$TMP_TOOL" "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-x86_64.AppImage"
    fi
    chmod +x "$TMP_TOOL"
    # appimagetool is itself an AppImage – extract it inside /tmp so we can run without FUSE
    (cd /tmp && "$TMP_TOOL" --appimage-extract >/dev/null 2>&1 || true)
  fi
  if [ -x "/tmp/squashfs-root/AppRun" ]; then
    APPIMAGETOOL="/tmp/squashfs-root/AppRun"
  else
    APPIMAGETOOL="$TMP_TOOL"
  fi
fi

echo "[fix-appimage] using appimagetool: $APPIMAGETOOL"

for appimage in "${APPIMAGES[@]}"; do
  echo "[fix-appimage] processing $appimage"

  workdir="$(mktemp -d)"
  # Resolve absolute path for extraction (relative paths break when cd'ing to workdir)
  appimage_abs="$(realpath "$appimage")"
  chmod +x "$appimage_abs"
  # Extract in workdir
  (cd "$workdir" && "$appimage_abs" --appimage-extract >/dev/null)

  extracted="$workdir/squashfs-root"
  if [ ! -d "$extracted" ]; then
    echo "[fix-appimage] ERROR: extraction failed for $appimage (no squashfs-root)" >&2
    rm -rf "$workdir"
    exit 1
  fi

  before_count="$(find "$extracted" -type f -name "libwayland*.so*" 2>/dev/null | wc -l | tr -d ' ')"
  echo "[fix-appimage] found $before_count bundled libwayland libs before strip"

  if [ "$before_count" -eq 0 ]; then
    echo "[fix-appimage] nothing to strip for $appimage"
    rm -rf "$workdir"
    continue
  fi

  # Broad removal – mirrors the confirmed workaround `rm squashfs-root/usr/lib/libwayland-*.so*`
  # but catches any lib dir / arch variant that linuxdeploy might have chosen.
  find "$extracted" -type f -name "libwayland*.so*" -print -delete

  after_count="$(find "$extracted" -type f -name "libwayland*.so*" 2>/dev/null | wc -l | tr -d ' ')"
  echo "[fix-appimage] remaining libwayland libs after strip: $after_count"

  if [ "$after_count" -ne 0 ]; then
    echo "[fix-appimage] ERROR: still $after_count libwayland libs after strip" >&2
    find "$extracted" -name "libwayland*" >&2 || true
    rm -rf "$workdir"
    exit 1
  fi

  # Repack – ARCH is required by appimagetool
  output="$workdir/fixed.AppImage"
  ARCH=x86_64 "$APPIMAGETOOL" "$extracted" "$output" >/dev/null

  chmod +x "$output"
  # Verify the fixed AppImage does not contain libwayland
  verify_dir="$workdir/verify"
  mkdir -p "$verify_dir"
  (cd "$verify_dir" && "$output" --appimage-extract >/dev/null)
  verify_count="$(find "$verify_dir/squashfs-root" -type f -name "libwayland*.so*" 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$verify_count" -ne 0 ]; then
    echo "[fix-appimage] ERROR: repacked AppImage still contains libwayland libs" >&2
    find "$verify_dir/squashfs-root" -name "libwayland*" >&2 || true
    rm -rf "$workdir"
    exit 1
  fi

  mv -f "$output" "$appimage_abs"
  echo "[fix-appimage] fixed $appimage"

  rm -rf "$workdir"
done

echo "[fix-appimage] all AppImages clean of libwayland"
