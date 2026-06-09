/**
 * 全站外链常量与跳转 helper。
 *
 * TermPay / 豆分期预申请统一落到豆分期官网，避免各页面散落硬编码 URL。
 */

/** 豆分期（TermPay）预申请官网入口。 */
export const TERMPAY_APPLY_URL = "https://www.dowsure.com/dowpl/";

/** 新标签页打开豆分期预申请页。 */
export function openTermpayApply() {
  window.open(TERMPAY_APPLY_URL, "_blank", "noopener,noreferrer");
}
