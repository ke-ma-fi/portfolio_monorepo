#include <cs50.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

int main(int argc, string argv[])
{
    // Make sure program was run with just one command-line argument
    if (argc != 2)
    {
        printf("Usage: ./caesar key\n");
        return 1;
    }

    int n = strlen(argv[1]);
    int key = 0;

    for (int i = 0; i < n; i++)
    {
        // Make sure every character in argv[1] is a digit
        if (argv[1][i] < 48 || argv[1][i] > 57)
        {
            printf("Usage: ./caesar key\n");
            return 1;
        }
        // Convert argv[1] from a `string` to an `int` 973
        else
        {
            key += (argv[1][i] - 48) * pow(10, (n - 1 - i));
        }
    }

    // Prompt user for plaintext
    string plain = get_string("plaintext:  ");

    // For each character in the plaintext:
    // Rotate the character if it's a letter
    int x = strlen(plain);
    char chipher[x];

    printf("ciphertext: ");

    for (int i = 0; i < x; i++)
    {
        if (plain[i] >= 65 && plain[i] <= 90)
        {
            chipher[i] = ((plain[i] - 65 + key) % 26) + 65;
        }
        else if (plain[i] >= 97 && plain[i] <= 122)
        {
            chipher[i] = ((plain[i] - 97 + key) % 26) + 97;
        }
        else
        {
            chipher[i] = plain[i];
        }
        printf("%c", chipher[i]);
    }
    printf("\n");
    return 0;
}