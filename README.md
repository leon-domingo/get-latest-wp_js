# A Node script to download the latest Wordpress version with no dependencies besides the standard library

Just clone the repo, cd into it and run the script

```shell
./npm run download
```

If you want to download a different language version execute the following command, adding the language (_--lang_) as a parameter (_en_US_ in this case):

```shell
./npm run download --lang=en_US
```

You can also download the package in a couple of formats (**.tar.gz** or **.zip**) using the _--ext_ argument. Valid values are _tar.gz_ (default) and _zip_:

```shell
./npm run download --ext=zip
```

It requires **NodeJS 10.X (or later)**.
