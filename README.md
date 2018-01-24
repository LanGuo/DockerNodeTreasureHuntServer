## Treasure Hunt Server, Docker Style



### How to build

We'll use `dnths` or `DNTHS` as a shorthand for DockerNodeTreasureHuntServer, when tagging images and such.

#### Build a Docker Image from Dockerfile

```bash
cd DockerNodeTreasureHuntServer/
docker build . -t dnths_image
```


#### Run a Docker Image

For development, run the server non-detached and `rm` it upon exit:

```bash
docker run --rm -p 8888:8080 --name dnths_container dnths_image
```

This will make the web server available at `http://localhost:8888`.

To cancel a non-detached container, use `control-C` twice in a row.

---

For production, run the server detached without the `--rm` option:


```bash
docker run -d -p 8888:8080 --name dnths_container dnths_image
```


#### Development/Debugging Tips

```bash
docker build . -t dnths_image && docker run --rm -p 8888:8080 --name dnths_container dnths_image
```
