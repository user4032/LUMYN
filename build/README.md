# LUMYN Icon Placeholder

Іконки для додатку мають бути розміщені в цій папці:

- `icon.png` - для Linux (512x512 або більше)
- `icon.ico` - для Windows (містить розміри 16x16, 32x32, 48x48, 256x256)
- `icon.icns` - для macOS (містить всі необхідні розміри)

## Як створити іконки:

### Онлайн інструменти:
- https://www.icoconverter.com/ - конвертація PNG в ICO
- https://iconverticons.com/online/ - конвертація PNG в ICNS

### Локально (ImageMagick):
```bash
# Створити .ico
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico

# Створити .icns (macOS)
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

## Тимчасове рішення:

Electron-builder може працювати без іконок, використовуючи стандартну іконку Electron.
Для production релізу рекомендується додати власні іконки.
