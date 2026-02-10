import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#e6dcc8] bg-[#f7f1e4] px-6 py-8 text-sm text-[#5a4a2f]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="font-medium">© 2026 自由学社. 所有权利保留.</p>
          <p className="max-w-xl leading-6 text-[#6f5d42]">
            自由学社致力于服务休学 / 自学青少年与家长，提供社区地图、同伴连接与学习支持。
            我们尊重每位用户的隐私，并鼓励在互相尊重与守法合规的前提下开展交流。
          </p>
        </div>

        <div className="grid gap-2 text-[#5a4a2f]">
          <Link className="underline-offset-4 hover:underline" href="/privacy-policy">
            隐私政策
          </Link>
          <Link className="underline-offset-4 hover:underline" href="/terms">
            使用条款
          </Link>
          <div className="pt-1 leading-6 text-[#6f5d42]">
            <p className="font-medium text-[#5a4a2f]">联系我们</p>
            <p>公众号：自由学社 Liberal Academy</p>
            <p>微信号：504302201</p>
            <p>
              邮箱：
              <a className="underline-offset-4 hover:underline" href="mailto:xtong717@gmail.com">
                xtong717@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
