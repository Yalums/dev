# Lyra Exporter

<div align="center">

**모든 것을 보존하는 AI 대화 내보내기 도구**

[![라이브 데모](https://img.shields.io/badge/🌐_라이브_데모-yalums.github.io-blue?style=for-the-badge)](https://yalums.github.io/lyra-exporter/)
[![Tampermonkey 스크립트](https://img.shields.io/badge/🔌_Tampermonkey-Greasy_Fork-orange?style=for-the-badge)](https://greasyfork.org/ko/scripts/539579-lyra-s-exporter-fetch)
[![라이선스](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[English](README.md) | [简体中文](README_zh.md) | [日本語](README_ja.md) | 한국어

**100% 오픈소스 • 프라이버시 완벽 보호 • 분기 완전 내보내기**

</div>

---

## 🎯 왜 Lyra Exporter인가?

다른 내보내기 도구들은 **대화 분기를 잃어버리고** **중요한 콘텐츠를 삭제**합니다. 이 도구는 다릅니다.

| 기능 | Lyra Exporter | 다른 도구 |
|---------|---------------|--------|
| **분기 내보내기** | ✅ 완전한 트리 구조 | ❌ 영구 손실 |
| **Canvas/Artifacts** | ✅ 완전 보존 | ❌ 삭제됨 |
| **한글 PDF** | ✅ 폰트 내장, 깨짐 없음 | ❌ □□□ 표시 |
| **사고 과정** | ✅ Claude/ChatGPT o1 지원 | ❌ 미지원 |
| **프라이버시** | ✅ 100% 로컬 처리 | ⚠️ 서버 업로드 |
| **일괄 내보내기** | ✅ 전체 대화→ZIP | ⚠️ 하나씩 |
| **내보내기 형식** | ✅ Markdown + PDF + 이미지 | ⚠️ Markdown만 |

---

## ✨ 특징

### 🌲 완전한 분기 보존
ChatGPT, Claude, Gemini 대화 분기를 완전 보존하는 **유일한 도구**. 메시지를 수정하고 새 경로를 만들어도 **모든 버전**을 저장합니다.

### 🔒 프라이버시 완벽 보호
- **백엔드 없음** - 모든 처리가 브라우저에서
- **분석 없음** - 추적하지 않습니다
- **네트워크 요청 없음** - 데이터가 기기를 벗어나지 않습니다
- **오픈소스** - 직접 코드를 감사할 수 있습니다

### 📦 모두 보존
다른 도구가 삭제하는 것도 저장:
- ✅ **Claude Artifacts** - 코드, 문서, 차트
- ✅ **ChatGPT Canvas** - 모든 캔버스와 반복
- ✅ **사고 과정** - Claude의 내부 사고, o1의 추론
- ✅ **도구 호출** - 웹 검색, 코드 실행, 파일 읽기
- ✅ **이미지** - 사용자 업로드 및 AI 생성 이미지
- ✅ **LaTeX 수식** - UI 및 PDF 내보내기에서 렌더링

### 🎨 3가지 내보내기 형식

#### 1️⃣ Markdown 내보내기
- GitHub 스타일, 구문 하이라이트 포함
- 분기 정보를 주석으로 포함
- 태그 마커: `[✅ 완료]` `[⭐ 중요]`
- 버전 관리에 완벽

#### 2️⃣ PDF 내보내기 *（고유 기능）*
- **한글 폰트 내장**（ARUDJingxihei） - □□□ 표시 없음
- **LaTeX 렌더링** - 수식을 올바르게 표시
- **굵게・기울임 지원** - 적절한 Markdown 형식
- **코드 구문 하이라이트** - 읽기 쉬운 코드 블록
- **A4 페이지 레이아웃** - 인쇄 가능

#### 3️⃣ 스크린샷 내보내기 *（고유 기능）*
- **픽셀 완벽** - UI 모양을 정확하게 캡처
- **자동 분할** - 긴 대화를 여러 이미지로
- **플랫폼 스타일** - 색상, 아바타, 아이콘 유지
- **라이트/다크 테마** - 내보내기 테마 선택

### 🏷️ 스마트 태그 시스템
- 메시지 표시: ✅ 완료 | ⭐ 중요 | 🗑️ 삭제
- **필요한 것만 내보내기** - 태그로 필터링
- 파일 간 통계 - 모든 태그된 메시지 표시
- 내보내기에서 태그 보존

### 🌍 멀티 플랫폼 지원

**6개 이상의 AI 플랫폼 지원:**
- 🤖 **Claude** - 단일 채팅 + 전체 계정 내보내기（프로젝트, Artifacts, 사고）
- 💬 **ChatGPT** - 단일 채팅 + 전체 계정 내보내기（Canvas, o1 사고, 워크스페이스）
- 🔷 **Gemini** - 분기가 있는 대화
- 📚 **NotebookLM** - 노트북 내보내기
- 🎓 **Google AI Studio** - AI Studio 채팅
- 🎭 **SillyTavern** - 분기가 있는 JSONL

**전체 계정 내보내기** ChatGPT 및 Claude용 - 한 번의 클릭으로 전체 대화 기록 가져오기:
- 워크스페이스/프로젝트 간 모든 대화
- 첨부 파일, Artifacts, Canvas 항목
- 사고 과정 및 도구 호출
- Markdown/PDF/이미지로 한 번에 일괄 변환

---

## 🚀 빠른 시작

### 옵션 1: 온라인 사용（권장）

**바로 접속:** [https://yalums.github.io/lyra-exporter/](https://yalums.github.io/lyra-exporter/)

### 옵션 2: 동반 스크립트 설치

Tampermonkey 스크립트로 **한 번의 클릭**으로 대화 가져오기:

1. [Tampermonkey](https://www.tampermonkey.net/) 설치
2. [Lyra Exporter Fetch](https://greasyfork.org/ko/scripts/539579-lyra-s-exporter-fetch) 설치
3. ChatGPT/Claude/Gemini 방문 후 내보내기 버튼 클릭
4. Lyra Exporter에 자동 로드 ✨

### 옵션 3: 로컬 실행

```bash
git clone https://github.com/Yalums/lyra-exporter.git
cd lyra-exporter
npm install
npm start
```

---

## 📸 스크린샷

<details>
<summary>클릭하여 확장</summary>

### 환영 페이지
![Welcome](https://i.postimg.cc/T3cSmKBK/Pix-Pin-2025-10-15-08-32-35.png)

### 전역 검색
![Search](https://i.postimg.cc/C1xSd5Hp/Pix-Pin-2025-10-16-16-33-44.png)

### 카드 뷰
![Cards](https://i.postimg.cc/05Fq2JqY/Pix-Pin-2025-10-15-08-46-09.png)

### 분기가 있는 타임라인
![Timeline](https://i.postimg.cc/hG1SX40R/Pix-Pin-2025-10-15-08-44-10.png)

</details>

---

## 🎯 사용 사례

### 개발자용
- 구문 하이라이트가 있는 코드 스니펫 내보내기
- 모든 Artifacts 및 도구 호출 보존
- AI 대화 버전 관리
- 적절한 형식으로 대화 공유

### 연구자용
- 전체 연구 대화 내보내기
- PDF에서 LaTeX 수식 올바르게 렌더링
- 중요한 통찰력에 태그 지정하여 나중에 검토
- 대화 간 검색

### 프라이버시 중시 사용자용
- 100% 로컬 처리 - 데이터 업로드 없음
- 오픈소스 코드 감사
- AI 대화 완전 제어
- 추적이나 분석 없음

### 파워 유저용
- 수백 개의 대화 일괄 내보내기
- 태그 및 별표로 정리
- 다양한 요구에 맞는 여러 내보내기 형식
- 전체 계정 기록 백업

---

## 🛠️ 기술 스택

- **React 19.1** - 최신 UI 프레임워크
- **TailwindCSS 3.4** - 유틸리티 우선 스타일링
- **jsPDF** - 사용자 정의 폰트가 있는 PDF 생성
- **html2canvas** - 스크린샷 렌더링
- **KaTeX** - LaTeX 수식 렌더링
- **react-markdown** - Markdown 표시

**백엔드 없음. 데이터베이스 없음. 순수한 클라이언트 측 마법.** ✨

---

## 🌟 고유 기능 상세

### 분기 시각화
대화는 선형적이지 않습니다. 메시지를 수정하고 재생성하면 **분기**가 생성됩니다. 다음을 수행할 수 있는 유일한 도구:
- 모든 분기 지점 자동 감지
- 대화 트리 시각화
- 모든 분기 내보내기（활성 경로뿐만 아니라）
- 분기 간 시각적 탐색

### 한글 지원 PDF 내보내기
대부분의 PDF 내보내기 도구는 한글에 대해 `□□□`를 표시합니다. 이 도구는 다릅니다.
- **ARUDJingxihei 폰트 내장**（오픈소스, 각 약 9MB）
- **3가지 폰트 두께**: Regular, Bold, Light
- **폰트 검증**: TTF 매직 넘버, 파일 크기, Unicode cmap 확인
- **우아한 폴백**: 폰트 실패 시 Helvetica로
- **CJK 커버리지**: 간체/번체 중국어, 일본어 한자, 한국어 한자

### 스크린샷 내보내기
왜 스크린샷인가? 때로는 형식이 중요하기 때문입니다.
- **플랫폼별 스타일링** - ChatGPT 녹색, Claude 보라색 유지
- **자동 분할** - X픽셀 이상 대화→여러 이미지
- **구성 가능** - 너비, 높이 제한, 스케일, 형식（PNG/JPG）, 테마
- **일괄 내보내기** - 여러 이미지를 ZIP으로 패키징

---

## 📊 기능 비교

| 기능 | Lyra Exporter | ChatGPT Exporter | 브라우저 확장 |
|---------|---------------|------------------|-----------------|
| 멀티 플랫폼 | 6개 이상 | ChatGPT만 | 1-2 플랫폼 |
| 분기 내보내기 | ✅ 전체 트리 | ❌ 활성 경로만 | ❌ 분기 없음 |
| Artifacts/Canvas | ✅ 보존됨 | ⚠️ 텍스트만 | ❌ 삭제됨 |
| PDF 내보내기 | ✅ 폰트 포함 | ❌ PDF 없음 | ⚠️ 기본 PDF |
| 스크린샷 | ✅ 자동 분할 | ❌ 수동 | ❌ 없음 |
| 사고 과정 | ✅ 완전 | ⚠️ 부분적 | ❌ 없음 |
| 일괄 내보내기 | ✅ ZIP 패키징 | ⚠️ 수동 | ❌ 하나씩 |
| 프라이버시 | ✅ 100% 로컬 | ⚠️ 달라짐 | ⚠️ 업로드 위험 |
| 오픈소스 | ✅ MIT | ⚠️ 일부 | ❌ 폐쇄 |
| LaTeX 렌더링 | ✅ KaTeX | ❌ 없음 | ❌ 없음 |
| 태그 시스템 | ✅ 3가지 유형 | ❌ 없음 | ❌ 없음 |

---

## 🤝 기여

기여를 환영합니다! 가이드라인은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참조하세요.

**도움이 필요한 분야:**
- [ ] 자동화된 테스트
- [ ] 추가 내보내기 형식（Word, HTML）
- [ ] 모바일 앱 버전
- [ ] 더 많은 플랫폼 지원
- [ ] 문서 번역

---

## 📜 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE) 참조

**Claude와 공동 제작** - 이 전체 프로젝트는 AI와의 대화를 통해 구축되었습니다. 메타네요?

---

## ⭐ 이 프로젝트 지원

Lyra Exporter가 대화를 저장했다면 별표를 주세요! ⭐

다른 사람들이 이 도구를 발견하고 프로젝트를 유지하는 데 도움이 됩니다.

---

## 🔗 링크

- 🌐 **라이브 데모**: https://yalums.github.io/lyra-exporter/
- 🔌 **Tampermonkey 스크립트**: https://greasyfork.org/ko/scripts/539579-lyra-s-exporter-fetch
- 📖 **문서**: [Wiki 보기](https://github.com/Yalums/lyra-exporter/wiki)
- 🐛 **문제 보고**: [GitHub Issues](https://github.com/Yalums/lyra-exporter/issues)
- 💬 **토론**: [GitHub Discussions](https://github.com/Yalums/lyra-exporter/discussions)

---

<div align="center">

**❤️와 많은 AI 대화로 만들어졌습니다**

*당신의 대화는 소중합니다. 안전하게 보관하세요.*

</div>
