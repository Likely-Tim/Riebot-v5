# Riebot-v5

## Install NVM and Node
```
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash | source ~/.bashrc
nvm install v18.13.0
```
## Install Bot
```
git clone https://github.com/Likely-Tim/Riebot-v5
```
## Install Packages
```
cd Riebot-v5/
npm install
```
## Run Bot
```
npm start
```
## For Low Memory Machines
```
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
sudo cp /etc/fstab /etc/fstab.bak
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Redirect Ports for Node
```
sudo iptables -I INPUT -j ACCEPT
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3000
sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-ports 8443
sudo netfilter-persistent save
```
## ChartJS
```
sudo apt install fontconfig
```
## Add Callback

- Auth0
- Spotify
- MyAnimeList
- Anilist

## Install pm2
```
npm install pm2@latest -g
pm2 link 9e2fulre781n7cz 116fxam405veywu
```
## pm2
```
pm2 list
pm2 start npm --name Riebot-v5 --cron-restart="0 0 * * *" --time --restart-delay=60000 -- start
pm2 kill
```

## Add Bot to Server
https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands