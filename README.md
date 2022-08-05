# GoEscape - Golang escape analysis for Visual Studio Code

# Build
If you have npm on your machine, you can install vsce using command
```sh
npm install -g vsce
```
Then, you can build the extension using command
```sh
vsce package
```
If you dont have npm, you can build using docker
```sh
docker build -t goescape/builder .
mkdir -p out

# path /app/out has vscode extension in .vsix format
docker run -it --rm -v `pwd`/out:/app/out goescape/builder
```

# Run
Right click on the vscode extension after building and select 'Install Extension VSIX'
