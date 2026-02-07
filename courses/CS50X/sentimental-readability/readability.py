# TODO


def main():
    text = input("Text: :")
    g = grade(text)
    if g < 1:
        print("Before Grade 1")
    elif g >= 16:
        print("Grade 16+")
    else:
        print(f"Grade {g}")


def word_count(text):
    count = 0
    for c in text:
        if c == " ":
            count += 1
    return count + 1


def L(text):
    count = 0
    list = [".", "!", "?", ",", "'", " "]
    for c in text:
        if not c in list:
            count += 1
    return float(count / word_count(text)) * 100


def S(text):
    count = 0
    list = [".", "!", "?"]
    for c in text:
        if c in list:
            count += 1
    return float(count / word_count(text)) * 100


def grade(text):
    return round(0.0588 * L(text) - 0.296 * S(text) - 15.8)


if __name__ == "__main__":
    main()
