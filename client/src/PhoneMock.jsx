import Avatar from './Avatar.jsx';

/* Illustrated reel on a phone — a creator avatar with typical reel UI. No real people or third-party content. */
export default function PhoneMock({ stat, label = 'Reels', skin, hair, top, style, extras }) {
  return (
    <div className="phone" aria-hidden>
      <div className="phone-screen">
        <Avatar skin={skin} hair={hair} top={top} style={style} extras={extras} bg={['#0b5545', '#04372f']} size="100%" />
        <div className="phone-top"><span>Reels</span><span>＋</span></div>
        {stat && <span className="phone-stat">{stat}</span>}
        <div className="phone-side"><span><i>❤</i>1.6M</span><span><i>💬</i>2.4K</span><span><i>↗</i>Share</span></div>
        <div className="phone-cap"><b>@creator · {label}</b>Creator-led campaign</div>
      </div>
    </div>
  );
}
