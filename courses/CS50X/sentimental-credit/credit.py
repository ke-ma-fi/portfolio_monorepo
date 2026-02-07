c# TODO


def main():
    while True:
        crdnbr = promt_user()
        if crdnbr.strip("0123456789") == "":
            break

    if check_luhn(crdnbr) == True:
        card_type(crdnbr)
    else:
        print("INVALID")


def promt_user():
    crdnbr = input("Number: ")
    return crdnbr


def check_luhn(crdnbr):
    n = len(crdnbr) - 1
    sum = 0

    while n >= 0:
        sum += int(crdnbr[n])
        n -= 1
        if n >= 0:
            pd = int(crdnbr[n]) * 2
            sum += (pd // 10) + (pd % 10)
            n -= 1

    if sum % 10 == 0:
        return True

    return False


def card_type(crdnbr):
    match crdnbr[:2]:
        case "34" | "37":
            if len(crdnbr) == 15:
                print("AMEX")
                return
        case "51" | "52" | "53" | "54" | "55":
            if len(crdnbr) == 16:
                print("MASTERCARD")
                return

    if crdnbr[0] == "4" and (len(crdnbr) == 13 or len(crdnbr) == 16):
        print("VISA")
        return

    print("INVALID")


if __name__ == "__main__":
    main()
