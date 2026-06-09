# public/ 静态资源

Vite 会把本目录下的文件原样挂到网站根路径 `/`。

## 报名二维码（必填）

服务商控制台「立即报名 / 活动报名」弹窗里的二维码读取的是：

```
public/signup-qr.png   →  网站里通过  /signup-qr.png  访问
```

把你的报名二维码图片（建议正方形 PNG，≥ 300×300）命名为 **`signup-qr.png`** 放到本目录即可，
弹窗会自动显示；没有放置时弹窗会显示「二维码图片请放在 public/signup-qr.png」的兜底提示。

要换成别的文件名/路径，改 `src/components/ServiceStatusPage.tsx` 里 `SignupQrModal` 的 `<img src=...>`。
