# Análise completa do projeto Help Me Fast (Electron)

Este documento descreve o app Electron na pasta `help_me_fast` para servir de base na migração para React Native (Android). O design e as funcionalidades devem ser mantidos, adaptados para telas mobile.

---

## 1. Visão geral do produto

- **Nome:** Help Me Fast
- **Objetivo:** Aplicativo de auxílio ao jejum prolongado — quebra o “piloto automático” de comer, com awareness de fases metabólicas, timer e dicas.
- **Plataforma atual:** Linux (Electron), janela frameless, sidebar, Vite + React + TypeScript.
- **Armazenamento:** **Local-first (BYOS)** — o usuário escolhe uma pasta “vault”; todos os dados ficam lá em JSON (sem nuvem, sem conta).

---

## 2. Stack técnico (Electron)

| Camada        | Tecnologia |
|---------------|------------|
| Runtime       | Electron 28 |
| Build         | Vite 5, esbuild (main/preload) |
| Linguagem     | TypeScript (strict) |
| UI            | React 18 (componentes funcionais, hooks) |
| Estilo        | **styled-components 6** |
| Estado        | React Context + useReducer (store único) |
| Gráficos      | **Recharts** (AreaChart no histórico) |
| Ícones        | **lucide-react** |
| Persistência  | Node `fs` via IPC do Electron (sem backend) |

---

## 3. Estrutura de pastas e arquivos principais

```
help_me_fast/
├── electron/
│   ├── main.ts          # Processo principal: janela, IPC (vault, history, settings, dialogs, controles)
│   └── preload.ts       # contextBridge API para o renderer
├── src/
│   ├── App.tsx          # Shell: sidebar, drag region, controles de janela, roteamento de views, splash de loading
│   ├── main.tsx
│   ├── index.css        # Reset + tipografia (Inter)
│   ├── assets/
│   │   └── logo.png     # Logo do app
│   ├── components/
│   │   ├── Dashboard/         # Timer: MetabolicArc, stats, tips, seletor de duração, "End Fast"
│   │   ├── FastTypeSelector/  # Tiles de duração + horas customizadas
│   │   ├── HistoryScreen/     # Gráfico de peso, timeline, AddEntryModal
│   │   ├── MetabolicArc/     # Roda SVG, gradiente, máscara, ticks de fase, tooltips, knob com avatar
│   │   ├── PanicButton/       # "Estou com fome" + modal de interrupção de padrão
│   │   ├── ProfileSetup/      # Formulário de perfil, avatar, danger zone (desconectar vault)
│   │   ├── Sidebar/           # Nav (Timer / Histórico / Perfil), card do perfil, badge do vault
│   │   ├── VaultSetup/        # Primeira execução: escolher pasta, nome, avatar, depois perfil
│   │   └── WindowControls/    # Minimizar, maximizar, fechar (frameless)
│   ├── context/
│   │   └── AppContext.tsx      # Estado global (vault, profile, config, history, currentFast, activeView)
│   ├── data/
│   │   └── fastingTips.ts      # Dicas categorizadas (eletrólitos, hidratação, etc.) e rotação
│   ├── hooks/
│   │   ├── useFastingTimer.ts      # Countdown, start/end fast, persistir active-fast.json
│   │   ├── useMetabolicMotivation.ts # BMR/TDEE, gordura queimada, peso projetado, mensagem de fase
│   │   └── useVault.ts             # load/save config, profile, history, active-fast; init; deleteVault
│   ├── styles/
│   │   └── theme.ts            # Cores, espaçamentos, bordas, sombras, tipografia
│   ├── types/
│   │   ├── index.ts            # Config, Profile, History, ProgressEntry, AppState, etc.
│   │   └── electron.d.ts       # Tipagem de Window.electronAPI
│   └── utils/
│       ├── calculateTMB.ts     # BMR (Mifflin-St Jeor) + TDEE
│       ├── weightConverter.ts  # kg ↔ lbs
│       ├── metabolicPhases.ts  # Fases (Anabolic, Catabolic, Fat Burn, Ketosis), danger zones
│       ├── activityMultipliers.ts # Multiplicadores de atividade para TDEE
│       └── fastTypes.ts       # Tipos de jejum (16h, 18h, 24h, 48h, 72h, custom)
├── build/
│   └── icons/                 # PNG 16–1024px para electron-builder e instalador
├── logos/                      # Logo original (Photoroom)
├── release/                    # AppImage, linux-unpacked, etc. (build)
├── package.json
├── vite.config.ts
├── build-electron.js
├── install.sh / uninstall.sh
└── README.md
```

---

## 4. Fluxo de telas (navegação)

1. **Splash de loading** — Enquanto verifica `getLastVault()` (auto-load).
2. **VaultSetup** — Se não há vault: escolher pasta, nome, avatar, continuar → cria vault e vai para perfil.
3. **ProfileSetup** (sem perfil completo) — Nome, peso, altura, idade, gênero, atividade, avatar; salva no vault.
4. **App principal** — Sidebar + área principal:
   - **Timer (Dashboard)** — Roda metabólica, timer, stats, dicas, “Start Fast” / “End Fast”, Panic Button.
   - **History** — Gráfico de peso (Recharts), timeline de entradas (data, peso, foto, notas), “New Entry”, deletar.
   - **Profile** — Mesmo formulário de perfil + “Disconnect Vault” (danger zone).

**Controles de janela** (minimizar/maximizar/fechar) e **drag region** são específicos de desktop; no Android não existem (usar status bar nativa).

---

## 5. Design system (theme)

- **Background geral:** `#F2F2F7`
- **Superfícies:** `#FFFFFF`
- **Texto:** primary `#2D3436`, secondary `#636E72`, muted `#B2BEC3`
- **Accent / gradiente principal:** `#FF9966` → `#FF5E62` (laranja/coral)
- **Fases metabólicas:** Anabolic `#38B2AC`, Catabolic `#ECC94B`, Fat Burn `#ED8936`, Ketosis `#D53F8C`
- **Success / Warning / Danger:** `#00B894`, `#FDCB6E`, `#D63031`
- **Border radius:** sm 8px, md 12px, lg 16px, xl 24px
- **Sombras:** sm/md/lg suaves
- **Fonte:** Inter (Google Fonts)

No React Native: manter essas cores e proporções; usar StyleSheet ou styled-components nativos / tema centralizado.

---

## 6. Dados e Vault (arquivos no disco)

Tudo fica numa pasta escolhida pelo usuário (vault):

| Arquivo / pasta | Conteúdo |
|-----------------|----------|
| `config.json`   | theme, notifications, dangerZones, weightUnit (kg/lbs) |
| `profile.json` | name, avatar (path relativo), weight, height, age, gender, activityLevel, tmb |
| `history.json` | fasts[], progressEntries[] (id, date, weight?, photoPath?, notes?) |
| `active-fast.json` | isActive, startTime, targetHours (persiste jejum entre reinícios) |
| `avatar.png`   | Foto de perfil |
| `photos/`      | Fotos das entradas de progresso |

No Android: o “vault” pode ser um diretório no armazenamento do app (e.g. `getFilesDir()` ou DocumentPicker para o usuário escolher). Leitura/escrita via módulos nativos (ex.: `react-native-fs`) ou APIs do React Native que acessem o sistema de arquivos.

---

## 7. API Electron (IPC) — o que substituir no RN

O renderer usa `window.electronAPI` (exposto pelo preload). Resumo:

| API | Uso | Equivalente no Android |
|-----|-----|-------------------------|
| **settings.getLastVault** | Path da última pasta vault | AsyncStorage / SecureStore com chave `lastVaultPath` (ou path interno fixo) |
| **settings.setLastVault** | Salvar path do vault | Idem |
| **vault.selectFolder** | Diálogo “escolher pasta” | DocumentPicker ou diretório interno do app |
| **vault.selectImage** | Escolher foto (perfil/entrada) | launchImageLibrary (expo-image-picker ou react-native-image-picker) |
| **vault.saveAvatar** | Salvar base64 como avatar.png no vault | Escrever arquivo no vault (react-native-fs ou FileSystem do expo) |
| **vault.loadAvatar** | Ler avatar do vault → base64 | Ler arquivo e converter para base64 ou usar URI |
| **vault.readFile** | Ler JSON (config, profile, history, active-fast) | FileSystem.readAsStringAsync / RNFS.readFile |
| **vault.writeFile** | Escrever JSON | FileSystem.writeAsStringAsync / RNFS.writeFile |
| **vault.fileExists** | Verificar se arquivo existe | FileSystem.getInfoAsync / RNFS.exists |
| **vault.initVault** | Criar pasta e arquivos iniciais | Criar diretório + escrever JSONs default |
| **history.addEntry** | Adicionar entrada (data, peso, photoBase64, notes) | Atualizar history.json + salvar foto em photos/ |
| **history.getAll** | Listar entradas com photos em base64 | Ler history.json + carregar fotos |
| **history.deleteEntry** | Remover entrada e foto | Atualizar history.json + apagar arquivo da foto |
| **window.*** | Minimize, maximize, close | N/A no Android |

Implementar uma camada de “storage service” no RN que ofereça as mesmas funções (async), usando sistema de arquivos + AsyncStorage onde fizer sentido.

---

## 8. Componentes principais (resumo para portar)

- **App.tsx**  
  - ThemeProvider (styled-components) → no RN pode ser ThemeProvider + StyleSheet usando o mesmo `theme`.  
  - Fluxo: boot → VaultSetup ou ProfileSetup ou app com Sidebar + MainArea.  
  - Remover DragRegion e WindowControls; no Android usar navegação por abas ou drawer.

- **Sidebar**  
  - Largura fixa 250px, perfil (avatar + nome + “Help Me Fast!”), nav (Timer, History, Profile), footer com badge do vault.  
  - No Android: **Bottom Tabs** ou **Drawer** com os mesmos itens e mesmo visual (cores, ícones).

- **Dashboard**  
  - MetabolicArc (sempre visível).  
  - Se **idle:** FastTypeSelector + “Ready to start Xh?” + “Start Fast”.  
  - Se **active:** barra de progresso %, grid de métricas (Fat Burned, Projected Loss, Current Phase), card de dica rotativa, mensagem de fase, Panic Button + “End Fast”.  
  - Manter layout responsivo (no mobile: coluna única, cards empilhados).

- **MetabolicArc**  
  - SVG: arco com gradiente (ouro → laranja), máscara que “esvazia” com o tempo, ticks por fase, knob (avatar ou círculo) na posição das horas.  
  - No RN: **react-native-svg** (Path, Circle, Defs, LinearGradient, ClipPath, etc.).  
  - Tooltips em hover → no mobile usar **press/long-press** para mostrar modal ou bottom sheet com a mesma informação (fase, descrição, proTip).  
  - Central: timer (HH:MM:SS) ou “GOAL: Xh”, badge da fase atual.

- **FastTypeSelector**  
  - Grid de tiles (16h, 18h, 20h, 24h, 36h, 48h, 72h, …) + tile “Custom” (input de horas + Add).  
  - No RN: FlatList ou grid com TouchableOpacity, mesmo estilo (borda, cor de destaque).

- **PanicButton**  
  - Botão “I'm Hungry / I'm Going to Eat” → modal: “Real hunger or boredom/habit?” → “It's Boredom/Habit” (fecha) ou “Real Hunger” (endFast()).  
  - No RN: Modal + botões; lógica idêntica.

- **VaultSetup**  
  - Logo, título “Help Me Fast!”, avatar (upload), nome, “Select Vault Folder & Continue”.  
  - No Android: em vez de “Select Folder”, pode ser “Use app storage” (diretório interno) ou DocumentPicker para pasta. Manter fluxo: avatar + nome → “Continue” → init vault → ir para ProfileSetup.

- **ProfileSetup**  
  - Formulário: nome, peso (kg/lbs), altura, idade, gênero, atividade, avatar.  
  - Danger zone: “Disconnect Vault” com confirmação.  
  - No RN: mesmo formulário com TextInput, Picker/Select, Image picker; modal de confirmação igual.

- **HistoryScreen**  
  - Título “My Journey”, botão “New Entry”.  
  - Gráfico de peso: Recharts AreaChart → no RN usar **react-native-chart-kit** ou **victory-native** ou **react-native-svg-charts**.  
  - Timeline: cards com data, peso, foto (photoBase64), notas, botão deletar.  
  - AddEntryModal: data, peso, foto, notas; salvar via “history.addEntry”.

- **AddEntryModal**  
  - Campos: date, weight, progress photo (base64), notes.  
  - No RN: Modal + ImagePicker para foto; resto igual.

- **WindowControls**  
  - Não portar (só desktop).

---

## 9. Hooks e lógica de negócio (reutilizar 100%)

- **useFastingTimer** — startFast(targetHours), endFast(), elapsedSeconds, countdown (hours, minutes, seconds), progress, weightLoss (calculado). Depende de useVault (saveActiveFast, saveHistory). **Portar tal qual;** só trocar a persistência (useVault no RN usando storage service).
- **useMetabolicMotivation** — fatBurnedInGrams, currentMessage, projectedFinalWeightLoss, caloriesBurned, projectedCalories. Só cálculos e dados estáticos. **Portar tal qual.**
- **useVault** — loadConfig, loadProfile, loadHistory, loadActiveFast, saveConfig, saveProfile, saveHistory, saveActiveFast, initializeVault, selectVaultFolder, deleteVault. **Portar a interface;** implementação interna usa “storage service” que no RN fala com arquivos + AsyncStorage.

---

## 10. Utilitários e dados estáticos (copiar)

- **types/index.ts** — Config, Profile, FastType, FastGoal, ProgressEntry, History, AppState, AppAction, ActiveView. **Copiar para o projeto RN.**
- **utils/calculateTMB.ts** — BMR (Mifflin-St Jeor) + TMB (TDEE). **Copiar.**
- **utils/weightConverter.ts** — kg/lbs. **Copiar.**
- **utils/activityMultipliers.ts** — Multiplicadores de atividade. **Copiar.**
- **utils/metabolicPhases.ts** — METABOLIC_PHASES, getCurrentPhase, getPhaseProgress, isDangerZone. **Copiar.**
- **utils/fastTypes.ts** — COMMON_FAST_TYPES, createCustomFastType. **Copiar.**
- **data/fastingTips.ts** — Lista de dicas por categoria e rotação (getRotatingTip, CATEGORY_META). **Copiar.**

---

## 11. Ícones e logo para o APK

- **Logo do app (splash/header):** `src/assets/logo.png`.
- **Ícones de instalação (Electron):** `build/icons/` (16x16 até 1024x1024).  
  Para Android (React Native):
  - **Android:** usar os PNGs em `android/app/src/main/res/` (mipmap-mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) e `android/app/src/main/res/mipmap-*/ic_launcher.png` (e round se usar).  
  - Gerar a partir do **1024x1024** ou do **512x512** (ferramentas como Android Asset Studio ou `npx react-native-asset`).
- **Logo adicional:** `logos/` (Photoroom) — pode servir de referência para splash ou ícone.

---

## 12. Checklist de migração para React Native (Android)

- [ ] Criar projeto React Native (Expo ou bare) com TypeScript.
- [ ] Copiar `theme` (cores, espaçamentos, tipografia) para um `theme.ts` e usar em StyleSheet ou styled-components.
- [ ] Copiar tipos (`types/`), utils e `data/fastingTips.ts`.
- [ ] Implementar “storage service” que substitua toda a API Electron (vault + history + settings).
- [ ] Portar AppContext e reducer (AppState, AppAction).
- [ ] Portar useVault, useFastingTimer, useMetabolicMotivation (adaptando useVault ao storage service).
- [ ] Navegação: Bottom Tabs ou Drawer (Timer, History, Profile) em vez de Sidebar.
- [ ] Telas: VaultSetup → ProfileSetup → Main (Dashboard, History, Profile).
- [ ] Dashboard: MetabolicArc com react-native-svg, FastTypeSelector, PanicButton, End Fast, cards de métricas e dicas.
- [ ] MetabolicArc: SVG completo; tooltips → modal/bottom sheet no toque.
- [ ] History: gráfico (react-native-chart-kit ou victory-native), timeline, AddEntryModal com ImagePicker.
- [ ] ProfileSetup e VaultSetup: formulários + avatar com ImagePicker; danger zone “Disconnect Vault”.
- [ ] Splash: logo + “Loading” enquanto carrega lastVault / init.
- [ ] Ícones do app: usar `build/icons` (ex.: 1024) para gerar recursos Android (mipmap).
- [ ] Testar fluxo completo: primeiro uso (vault + perfil) → iniciar jejum → ver timer e dicas → “Estou com fome” → encerrar → histórico e nova entrada.

---

## 13. Requisitos no seu PC para build Android

- **Android Studio** — para SDK, emulador e build do APK.
- **Java 17** (recomendado para RN recente).
- **Variáveis de ambiente:** `ANDROID_HOME` apontando para o SDK.
- **Node/npm** já usados no Electron.

Depois de instalar o Android Studio, você pode rodar `npx react-native run-android` ou gerar o APK de release conforme a documentação do React Native / Expo.

---

Este documento cobre estrutura, dados, API Electron, design, componentes e hooks do projeto Electron para você replicar o mesmo comportamento e visual no app Android em React Native. Se quiser, o próximo passo pode ser um esqueleto do projeto RN (pastas, navegação e storage service) ou a implementação tela a tela.
