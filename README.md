# Tutor App Mobile (React Native)

Este projeto foi migrado de React/Next.js para **React Native com Expo**.

## Requisitos

- Node.js 18+
- Expo CLI (via `npx expo`)

## Configuracao

Crie um arquivo `.env` na raiz com:

```env
EXPO_PUBLIC_API_ADDRESS=https://seu-backend
EXPO_PUBLIC_STUDY_API_ADDRESS=https://seu-backend-ou-api-estudo
```

Notas:
- `EXPO_PUBLIC_API_ADDRESS` e usado para login, quiz, ranking e agenda.
- `EXPO_PUBLIC_STUDY_API_ADDRESS` e usado para gerar plano e explicacoes (se nao existir, usa o mesmo valor da API principal).

## Executar

```bash
npm install
npm run start
```

Depois:
- pressione `a` para Android
- pressione `i` para iOS
- ou escaneie o QR Code no Expo Go

## Telas migradas

- Login / Cadastro
- Home (quiz, pontos, resumo)
- Perfil (ranking)
- Agenda de estudos
- Plano de estudos

## Estrutura

- `App.js`
- `src/navigation/AppNavigator.js`
- `src/screens/*`
- `src/services/api.js`
- `src/services/storage.js`
