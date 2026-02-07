#include <stdbool.h>
#include <stdio.h>
#include <string.h>

typedef struct
{
    char number[20];
} CreditCard;

bool isValid(const char *number);

int main()
{
    CreditCard card;
    printf("Kreditkartennumer eingeben: ");

    scanf("%19s", card.number);
    if (strlen(card.number) < 13)
    {
        printf("Die eingegebene Nummer ist zu kurz.\n");
        return 1;
    }

    if (isValid(card.number))
    {
        printf("Gültige Nummer\n");
    }
    else
    {
        printf("Ungültige Nummer\n");
    }

    return 0;
}







bool isValid(const char *number)
{
    int nDigits = strlen(number);
    int sum = 0;
    bool alternate = false;

    for (int i = nDigits - 1; i >= 0; i--)
    {
        int digit = number[i] - '0';

        if (alternate)
        {
            digit *= 2;
            if (digit > 9)
            {
                digit -= 9;
            }
        }

        sum += digit;
        alternate = !alternate;
    }

    return sum % 10 == 0;
}