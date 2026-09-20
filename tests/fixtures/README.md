`tone.webm` is a synthetic one-second blue 160×120 video with a 440Hz sine wave, generated for regression tests. It contains no user data or third-party media.

Regenerate with:

```sh
ffmpeg -f lavfi -i color=c=blue:s=160x120:r=10 -f lavfi -i sine=frequency=440:sample_rate=48000 -t 1 -c:v libvpx -c:a libopus tone.webm
```
