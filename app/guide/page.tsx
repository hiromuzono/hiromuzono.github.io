"use client";
import Link from "next/link";
export default function GuidePage() {
  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <header className="bg-[#1a1f3a] text-white px-5 py-4 flex items-center justify-between">
        <div><h1 className="text-base font-semibold tracking-wide">使い方ガイド</h1><p className="text-xs text-[#c9a84c] mt-0.5">親孝行チケット</p></div>
        <Link href="/" className="text-xs text-white/60 hover:text-white transition-colors">ホームへ</Link>
      </header>
      <div className="px-5 py-6 max-w-lg mx-auto space-y-6">
        <section className="bg-white border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-[#1a1f3a] uppercase tracking-wide mb-3">このアプリについて</h2>
          <p className="text-sm text-gray-600 leading-relaxed">「親孝行チケット」は、親が子にお願いごとをするための、大人版お手伝い券アプリです。チケットという形を使うことで、「迷惑かな…」という遠慮なく気軽にお願いできて、子も無理なく「これはできる・これはちょっと厳しい」と返事しやすくなります。</p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">交渉機能もあるので、「それは難しいけど、こっちならできるよ」というやりとりも自然にできます。親子でちょうどいいペースを見つけていきましょう。</p>
        </section>
        <section className="bg-white border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-[#1a1f3a] uppercase tracking-wide mb-4">基本の流れ</h2>
          <div className="space-y-4">
            {[{step:"1",who:"親",text:"やりたいことをチケットで申請します。枚数は負担感の目安です。"},{step:"2",who:"子",text:"新着リクエストを確認して、承認・辞退・交渉で返答します。"},{step:"3",who:"親",text:"交渉が来たら、提案された枚数で同意するか取り下げるか選びます。"},{step:"4",who:"両者",text:"承認されたら実行へ。チケットは自動的に消費されます。"}].map(({step,who,text})=>(
              <div key={step} className="flex gap-4"><div className="w-8 h-8 bg-[#1a1f3a] text-white flex items-center justify-center text-sm font-bold shrink-0">{step}</div><div><p className="text-xs font-semibold text-[#c9a84c] mb-0.5">{who}</p><p className="text-sm text-gray-600">{text}</p></div></div>
            ))}
          </div>
        </section>
        <section className="bg-white border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-[#1a1f3a] uppercase tracking-wide mb-1">チケット枚数の目安</h2>
          <p className="text-xs text-gray-400 mb-4">あくまで目安です。家族でルールを決めてください</p>
          <div className="border border-gray-200 overflow-hidden"><table className="w-full text-sm"><thead><tr className="bg-[#1a1f3a] text-white"><th className="text-left px-4 py-2.5 font-semibold">枚数</th><th className="text-left px-4 py-2.5 font-semibold">負担感の目安</th><th className="text-left px-4 py-2.5 font-semibold">例</th></tr></thead><tbody><tr className="border-t border-gray-100"><td className="px-4 py-3 font-bold text-[#c9a84c] whitespace-nowrap">0.5 枚</td><td className="px-4 py-3 text-gray-600">ちょっとだけ</td><td className="px-4 py-3 text-gray-500 text-xs">電話1本、写真を送ってほしい</td></tr><tr className="border-t border-gray-100 bg-gray-50"><td className="px-4 py-3 font-bold text-[#c9a84c] whitespace-nowrap">1 枚</td><td className="px-4 py-3 text-gray-600">半日〜1日</td><td className="px-4 py-3 text-gray-500 text-xs">食事に連れて行く、買い物を手伝う</td></tr><tr className="border-t border-gray-100"><td className="px-4 py-3 font-bold text-[#c9a84c] whitespace-nowrap">2 枚</td><td className="px-4 py-3 text-gray-600">丸1〜2日</td><td className="px-4 py-3 text-gray-500 text-xs">日帰り旅行、大きな模様替えの手伝い</td></tr></tbody></table></div>
        </section>
        <section className="bg-white border border-gray-200 p-5">
          <h2 className="text-sm font-bold text-[#1a1f3a] uppercase tracking-wide mb-3">ペースについて</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="leading-relaxed">チケットの上限は子が設定します。最初は少なめからはじめて、慣れてきたら少しずつ増やすのがおすすめです。</p>
            <p className="leading-relaxed">「今は忙しい」という時期も必ずあります。辞退や交渉の機能を遠慮なく使ってください。断ること・再交渉することはこのアプリの正常な使い方です。</p>
            <p className="leading-relaxed">大切なのは、親子の間で「気持ちが伝わること」。チケットはそのための道具として、気楽に使ってもらえたらと思います。</p>
          </div>
        </section>
        <section className="bg-[#1a1f3a] p-5">
          <h2 className="text-sm font-bold text-[#c9a84c] uppercase tracking-wide mb-3">ちょっとしたコツ</h2>
          <ul className="space-y-2.5">
            {["申請にコメントを一言添えると、子が返答しやすくなります","交渉は「断りたいわけじゃない」という気持ちの表れです","月に何枚使うか、はじめに家族で話し合っておくとスムーズです","チケットを使い切ったら、子に上限を増やしてもらいましょう"].map((tip,i)=>(
              <li key={i} className="flex items-start gap-3 text-sm text-white/80"><span className="shrink-0 mt-0.5"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#c9a84c" fillOpacity="0.3"/><path d="M4 7l2 2 4-4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>{tip}</li>
            ))}
          </ul>
        </section>
        <div className="text-center pb-6"><Link href="/" className="inline-block bg-[#1a1f3a] hover:bg-[#252b4a] text-white font-semibold px-8 py-3 text-sm transition-colors">ホームへ戻る</Link></div>
      </div>
    </div>
  );
}
