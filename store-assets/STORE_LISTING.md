# 강호의도리 / BroCode · 스토어 등록 자료

## 이미지 파일

| 용도 (Chrome 웹 스토어 칸) | 크기 | 파일 |
|---|---|---|
| 스크린샷 1~5 | 1280×800 | `ko/screenshot-1.png` … `ko/screenshot-5.png` (영어: `en/`) |
| 작은 프로모션 타일 | 440×280 | `ko/promo-small-440x280.png` |
| 마키 프로모션 타일 | 1400×560 | `ko/promo-marquee-1400x560.png` |

스크린샷 순서: 1 핵심 키 → 2 어디서나 동작 → 3 전/후 비교 → 4 건너뛰기 간격 + 팝업 → 5 사이트 키 존중.
이미지를 다시 만들 때: `node store-assets/src/render.js` (문구는 `store-assets/src/promo.html`).

---

## 한국어 (ko)

**이름** (manifest와 동일)
강호의도리 (동영상 건너뛰기 · 방향키 10초 이동 · 재생바 그라데이션 제거 · 볼륨 단축키)

**요약** (132자 이내, manifest와 동일)
어떤 동영상 사이트에서도 방향키로 건너뛰기·되감기, 위아래로 볼륨, 스페이스바로 재생/정지. 재생바 그라데이션과 hover 컨트롤을 없앱니다.

**상세 설명**

```
어떤 사이트는 → 를 누르면 5초, 어떤 사이트는 10초. 어떤 곳은 재생바를 한 번 클릭해야 키가 먹고, 어떤 곳은 아예 안 됩니다.
강호의도리는 이걸 하나로 맞춥니다. 어느 사이트에서 보든 같은 키로 같은 동작을 합니다.

■ 키 다섯 개
→ / ←   앞으로 / 뒤로 건너뛰기 (누르고 있으면 계속 이동)
↑ / ↓   볼륨 5%씩 올리기 / 내리기
Space   재생 / 일시정지

영상 화면을 클릭했든, 재생바를 클릭했든, 페이지 빈 곳을 클릭했든 똑같이 동작합니다.
키를 누르면 영상 위에 "+10s", "볼륨 40%" 같은 표시가 잠깐 뜹니다. 전체화면에서도요.

■ 영상을 가리는 것들 숨기기
재생바 뒤에 깔린 검은 그라데이션, 마우스만 올리면 뜨는 컨트롤바·미리보기 썸네일·툴팁을 숨깁니다.
자막과 영상 자체는 건드리지 않습니다.
YouTube, Video.js, JW Player, Plyr, Shaka Player, MediaElement.js, Flowplayer는 플레이어 종류를 알아보고 맞춰 정리합니다. 같은 플레이어를 쓰는 처음 보는 사이트에도 자동으로 적용됩니다.

■ 건너뛰기 간격
· 자동: 영상 길이를 보고 정합니다. 20분 미만 10초, 1시간 미만 15초, 그 이상 30초.
· 고정: 항상 15초.
· 직접 지정: 앞/뒤를 따로, 1~600초.

■ 사이트 단축키는 그대로
M 음소거, C 자막, F 전체화면처럼 사이트가 원래 쓰던 키는 손대지 않습니다.
검색창이나 댓글창에 입력 중일 때, 한글을 조합 중일 때, Ctrl·Alt·⌘ 조합키를 누를 때는 키를 가로채지 않습니다.
화면에 영상이 없으면 스페이스바는 평소처럼 스크롤합니다.

■ 그 밖에
· 다른 사이트에서 임베드한 영상(블로그 속 YouTube 등)도 조작합니다.
· 단축키와 UI 정리는 사이트마다 켜고 끌 수 있습니다. 컨트롤바를 숨기면 마우스로 누르던 버튼도 함께 사라지니, 버튼이 필요한 사이트에선 UI 정리만 꺼 두세요.
· 설정은 Chrome 동기화 저장소에 저장됩니다. 외부로 데이터를 보내지 않습니다.

■ 안 되는 것
· DRM이 걸린 영상(Netflix 등)이나 서버가 데이터를 주지 않는 구간은 이동이 제한될 수 있습니다.
· 플레이어가 위치를 강제로 되돌리면 "이 플레이어가 이동을 막고 있음"이라고 알려 드립니다.
· 광고 차단, 영상 다운로드 기능은 없습니다.
```

**카테고리 추천**: 도구 (Tools) 또는 생산성 (Productivity)

---

## English (en)

**Name**
BroCode (Video Skip Hotkeys, Remove Player Gradient, Hide Controls)

**Summary**
Arrow-key skip & rewind, volume and space-to-pause on any video site. Removes the dark player gradient and hover controls.

**Detailed description**

```
On one site → jumps 5 seconds. On another it's 10. Some players only listen to the keyboard after you click the seek bar, and some ignore it entirely.
BroCode makes them all behave the same way: same keys, same result, on any site.

■ Five keys
→ / ←   Skip forward / back (hold to keep going)
↑ / ↓   Volume up / down in 5% steps
Space   Play / pause

It works wherever you last clicked: the video, the seek bar, or empty space on the page.
A small overlay ("+10s", "Volume 40%") confirms each press, fullscreen included.

■ Clear the picture
Hides the dark gradient behind the seek bar and the controls, preview thumbnails and tooltips that appear on hover.
Subtitles and the video itself stay untouched.
YouTube, Video.js, JW Player, Plyr, Shaka Player, MediaElement.js and Flowplayer are recognised by player type, so a site BroCode has never seen still gets cleaned up if it runs one of them.

■ Skip interval
· Auto: based on video length. Under 20 min 10s, under 1 h 15s, longer 30s.
· Fixed: always 15s.
· Custom: forward and back set separately, 1 to 600s.

■ Your site's shortcuts still work
M for mute, C for captions, F for fullscreen and every other site key stay as they were.
BroCode keeps its hands off while you type in a search or comment box, during IME composition, and on any Ctrl, Alt or ⌘ combo.
No video on screen? Space scrolls the page like always.

■ Also
· Controls videos embedded from other sites (a YouTube video inside a blog post, for example).
· Hotkeys and clean-up can be switched per site. Hiding the controls also hides their buttons, so turn clean-up off on sites where you need them.
· Settings live in Chrome sync storage. Nothing is sent anywhere else.

■ Limits
· DRM video (Netflix and similar) and ranges the server hasn't delivered may not be seekable.
· If a player forces the position back, BroCode tells you the player is blocking seeking.
· No ad blocking, no downloading.
```

---

## 홍보용 짧은 글 (커뮤니티 · SNS)

**한국어 (커뮤니티 게시판용)**

```
동영상 사이트마다 방향키가 다르게 먹는 게 답답해서 크롬 확장을 하나 만들었습니다.

이름은 강호의도리.
→ ← 건너뛰기, ↑ ↓ 볼륨, 스페이스바 재생/정지를 어느 사이트에서든 똑같이 쓰게 해 줍니다. 재생바 클릭 안 해도 됩니다.
덤으로 재생바 뒤 검은 그라데이션이랑 마우스 올리면 뜨는 컨트롤바도 숨겨 줍니다. 자막은 그대로 두고요.

건너뛰기 간격은 영상 길이 보고 자동으로 10/15/30초. 직접 정할 수도 있습니다.
M, C, F 같은 사이트 원래 단축키는 안 건드립니다.

써 보시고 안 되는 사이트 있으면 알려 주세요. 플레이어 프리셋 추가하겠습니다.
[스토어 링크]
```

**한국어 (X / 스레드, 짧게)**

```
사이트마다 → 누르면 5초였다 10초였다 하는 거 지겨워서 만듦.
강호의도리: 어느 영상 사이트든 ←→ 건너뛰기, ↑↓ 볼륨, Space 재생. 재생바 그라데이션도 치워 줌.
[스토어 링크]
```

**English (X / Reddit)**

```
Got tired of → meaning 5s on one site, 10s on another, and nothing at all until I clicked the seek bar. So I built BroCode.
Arrow keys skip, ↑↓ set volume, Space plays/pauses, on any video site. It also hides the dark gradient and hover controls. Subtitles stay.
Tell me which site it breaks on and I'll add a preset.
[store link]
```
