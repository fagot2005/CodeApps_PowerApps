1. Відкрити або створити потрібний каталог на жорскому диску та перейти в нього.
2. Відкрити у Visual Studio Code цей каталог та виконати послідовно в Терміналі команди
3. npx degit github:microsoft/PowerAppsCodeApps/templates/vite my-app (my-app - замінити на потрібну назву App, наприклад Inventory App)
4. npm install
5. npx power-apps init (вказати EnvID and Display Name for the App)
6. Для тестуаання застосунку - npm run dev (після виконання команди зявиться лінк, по якому можна перейти (ЛКМ + CTRL))
7. Білд застосунку - npm run build
8. Публікація застосунку - npx power-apps push
9. Додати застосунок в Солбшен через Add existing - App - Code apps
