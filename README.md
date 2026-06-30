Відкрити або створити потрібний каталог на жорскому диску та перейти в нього.
Відкрити у Visual Studio Code цей каталог та виконати послідовно в Терміналі команди
npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app (my-app - замінити на потрібну назву App, наприклад Inventory App)
npm install
npx power-apps init (вказати EnvID and Display Name for the App)
Для тестуаання застосунку - npm run dev (після виконання команди зявиться лінк, по якому можна перейти (ЛКМ + CTRL))
Білд застосунку - npm run build
Публікація застосунку - npx power-apps push
Додати застосунок в Солбшен через Add existing - App - Code apps
