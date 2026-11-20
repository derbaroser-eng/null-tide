"""Tests for the NULL TIDE cover/share-card generator."""
import os

from PIL import Image

import sharecard


def test_dimensions():
    im = sharecard.generate_card(1)
    assert im.size == (1200, 630)


def test_mode_is_rgb():
    assert sharecard.generate_card(2).mode == "RGB"


def test_deterministic_same_seed():
    a = sharecard.generate_card(42).tobytes()
    b = sharecard.generate_card(42).tobytes()
    assert a == b


def test_different_seeds_differ():
    assert sharecard.generate_card(1).tobytes() != sharecard.generate_card(2).tobytes()


def test_string_seed_is_stable():
    assert sharecard.generate_card("tide").tobytes() == sharecard.generate_card("tide").tobytes()


def test_title_and_poem_change_output():
    base = sharecard.generate_card(7, title="A").tobytes()
    other = sharecard.generate_card(7, title="B", poem="one\ntwo").tobytes()
    assert base != other


def test_save_creates_valid_png(tmp_path):
    out = str(tmp_path / "cover.png")
    path = sharecard.save_card(7, out, title="THE PROVIDER")
    assert os.path.getsize(path) > 5000
    with Image.open(path) as im:
        assert im.format == "PNG"
        assert im.size == (1200, 630)


def test_cli_writes_file(tmp_path, monkeypatch):
    out = str(tmp_path / "cli.png")
    rc = sharecard.main(["--seed", "9", "--title", "THE DROWNER", "--out", out])
    assert rc == 0
    assert os.path.getsize(out) > 5000
