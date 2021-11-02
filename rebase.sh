git config --global user.email "hyperchessbot@gmail.com"
git config --global user.name "hyperchessbot"
rm -rf .git
git init
git remote add origin https://hyperchessbot:$GIT_TOKEN@github.com/hyperchessbot/openingtrainer.git
git checkout -b main
git add .
git commit -m "Initial commit"
git push --set-upstream --force origin main