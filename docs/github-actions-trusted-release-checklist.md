# GitHub Actions Trusted Release Checklist

Tài liệu này dùng để bật `phase 2` cho release pipeline của Cheese Booth:

- `macOS`: code signing + notarization
- `Windows`: code signing

Repo đích: `thaikpham/colorlabv2-photokiosk`

## Files Có Sẵn Trong Repo

- Secrets template: [docs/github-actions-secrets.template.env](./github-actions-secrets.template.env)
- Variables template: [docs/github-actions-variables.template.env](./github-actions-variables.template.env)
- Workflow release: [kiosk-app/.github/workflows/release.yml](../.github/workflows/release.yml)
- Windows sign command: [kiosk-app/src-tauri/tauri.windows.conf.json](../src-tauri/tauri.windows.conf.json)
- Windows sign script: [kiosk-app/src-tauri/scripts/sign-windows.ps1](../src-tauri/scripts/sign-windows.ps1)

## Quick Checklist

- [ ] Có Apple Developer account với certificate phù hợp cho phát hành ngoài App Store
- [ ] Có Windows code-signing certificate `.pfx`
- [ ] Đã export certificate thành file `.p12` hoặc `.pfx` dùng cho CI
- [ ] Đã tạo file `docs/github-actions-secrets.local.env` từ template
- [ ] Đã tạo file `docs/github-actions-variables.local.env` từ template
- [ ] Đã nạp đủ GitHub repository secrets
- [ ] Đã nạp đủ GitHub repository variables
- [ ] Đã kiểm tra lại release workflow bằng `workflow_dispatch` hoặc tag test
- [ ] Đã xem log release để xác nhận signing step có chạy thật

## 1. Tạo File Local Từ Template

```bash
cp docs/github-actions-secrets.template.env docs/github-actions-secrets.local.env
cp docs/github-actions-variables.template.env docs/github-actions-variables.local.env
```

Không commit hai file `.local.env` này.

## 2. Thu Thập Giá Trị Cho macOS

Điền các giá trị sau vào `docs/github-actions-secrets.local.env`:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `KEYCHAIN_PASSWORD`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`

### Cách tạo `APPLE_CERTIFICATE`

Xuất certificate `.p12` từ Keychain Access rồi chuyển sang base64 một dòng:

```bash
openssl base64 -A -in /path/to/developer-id-application.p12 -out apple-certificate.base64.txt
```

Lấy nội dung file `apple-certificate.base64.txt` và dán vào `APPLE_CERTIFICATE`.

### Ghi chú cho macOS

- `APPLE_PASSWORD` là app-specific password của Apple ID, không phải mật khẩu đăng nhập Apple ID chính.
- `APPLE_TEAM_ID` là Team ID của Apple Developer account.
- `KEYCHAIN_PASSWORD` có thể là một mật khẩu ngẫu nhiên riêng cho GitHub Actions keychain tạm.

## 3. Thu Thập Giá Trị Cho Windows

Điền các giá trị sau:

Trong `docs/github-actions-secrets.local.env`:

- `WINDOWS_CERTIFICATE`
- `WINDOWS_CERTIFICATE_PASSWORD`

Trong `docs/github-actions-variables.local.env`:

- `WINDOWS_CERTIFICATE_THUMBPRINT`
- `WINDOWS_DIGEST_ALGORITHM`
- `WINDOWS_TIMESTAMP_URL`

### Cách tạo `WINDOWS_CERTIFICATE`

Nếu đã có file `.pfx`, chuyển sang base64 một dòng:

Trên macOS hoặc Linux:

```bash
openssl base64 -A -in /path/to/windows-signing-certificate.pfx -out windows-certificate.base64.txt
```

Trên PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\certificate.pfx")) | Set-Content -NoNewline windows-certificate.base64.txt
```

Lấy nội dung file `windows-certificate.base64.txt` và dán vào `WINDOWS_CERTIFICATE`.

### Cách lấy `WINDOWS_CERTIFICATE_THUMBPRINT`

Trên Windows PowerShell:

```powershell
(Get-PfxCertificate -FilePath "C:\path\to\certificate.pfx").Thumbprint
```

Giá trị mặc định khuyến nghị:

- `WINDOWS_DIGEST_ALGORITHM=sha256`
- `WINDOWS_TIMESTAMP_URL=http://timestamp.digicert.com`

## 4. Nạp Vào GitHub Bằng Giao Diện Web

Vào:

- `Repository > Settings > Secrets and variables > Actions`

Thêm các repository secrets sau:

- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `KEYCHAIN_PASSWORD`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`
- `WINDOWS_CERTIFICATE`
- `WINDOWS_CERTIFICATE_PASSWORD`

Thêm các repository variables sau:

- `WINDOWS_CERTIFICATE_THUMBPRINT`
- `WINDOWS_DIGEST_ALGORITHM`
- `WINDOWS_TIMESTAMP_URL`

## 5. Nạp Vào GitHub Bằng `gh` CLI

Xác nhận đã đăng nhập:

```bash
gh auth login
```

Nạp secrets:

```bash
gh secret set -f docs/github-actions-secrets.local.env --repo thaikpham/colorlabv2-photokiosk
```

Nạp variables:

```bash
gh variable set -f docs/github-actions-variables.local.env --repo thaikpham/colorlabv2-photokiosk
```

Kiểm tra lại danh sách đã có trên GitHub:

```bash
gh secret list --repo thaikpham/colorlabv2-photokiosk
gh variable list --repo thaikpham/colorlabv2-photokiosk
```

## 6. Xác Minh Sau Khi Nạp

- Chạy `workflow_dispatch` cho workflow release hoặc đẩy một tag test
- Ở job macOS, xác nhận có chạy:
  - `Import Apple Developer Certificate`
  - `Resolve Apple Signing Identity`
- Ở job Windows, xác nhận có chạy:
  - `Import Windows signing certificate`
- Ở bước `Build and publish Tauri bundles`, xác nhận không còn chỉ là unsigned path nếu secrets đã đủ

## 7. Kỳ Vọng Sau Khi Bật Trusted Release

- UI `/#/download` vẫn lấy asset trực tiếp từ GitHub Releases
- Khác biệt là installer phát hành ra sẽ bắt đầu đi theo trust path tốt hơn
- Khi signing/notarization đã hoạt động ổn định, có thể cập nhật copy trên UI để giảm nhấn mạnh cảnh báo unsigned

## 8. Rotation Checklist

- [ ] Export certificate mới
- [ ] Regenerate base64
- [ ] Update `.local.env`
- [ ] Re-run `gh secret set -f ...` hoặc cập nhật bằng GitHub UI
- [ ] Chạy release test
- [ ] Thu hồi certificate cũ nếu policy nội bộ yêu cầu
