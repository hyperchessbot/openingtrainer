git config --global user.email "hyperchessbot@gmail.com"
git config --global user.name "hyperchessbot"
https://hyperchessbot:$GIT_TOKEN@github.com/hyperchessbot/openingtrainer.git
git checkout -b main
git add .
git commit -m "$*"
git push --set-upstream --force origin main