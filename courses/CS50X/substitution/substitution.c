#include <cs50.h>
#include <ctype.h>
#include <stdio.h>
#include <string.h>

bool checkdouble(int start, int end, char array[]);

int main(int argc, string argv[])
{
    // Make sure program was run with just one command-line argument
    if (argc != 2)
    {
        printf("Usage: ./substitution key\n");
        return 1;
    }

    // Make sure program was run with right amound of charakters
    int n = strlen(argv[1]);
    if (n != 26)
    {
        printf("Key must contain 26 characters.\n");
        return 1;
    }

    // Make sure all chars are characters, check double and make uppercase key
    char testkey[26];
    char key[26];
    for (int i = 0; i < 26; i++)
    {
        if ((argv[1][i] >= 65 && argv[1][i] <= 90) || (argv[1][i] >= 97 && argv[1][i] <= 122))
        {
            if (checkdouble(0, 26, argv[1]))
            {
                key[i] = toupper(argv[1][i]);
            }
            else
            {
                printf("Double use of characters detected. Please use each character just once!\n");
                return 1;
                break;
            }
        }
        else
        {
            printf("Key must contain characters only\n");
            return 1;
        }
    }

    // Prompt user for plaintext
    string plain = get_string("plaintext:  ");

    // For each character in the plaintext:
    int x = strlen(plain);
    char cipher[x];

    printf("ciphertext: ");

    for (int i = 0; i < x; i++)
    {
        if (plain[i] >= 65 && plain[i] <= 90)
        {
            cipher[i] = toupper(key[(plain[i] - 65)]);
        }
        else if (plain[i] >= 97 && plain[i] <= 122)
        {
            cipher[i] = tolower(key[(plain[i] - 97)]);
        }
        else
        {
            cipher[i] = plain[i];
        }
        printf("%c", cipher[i]);
    }
    printf("\n");
    return 0;
}

bool checkdouble(int start, int end, char array[])
{
    int alternate = 0;
    for (int i = start; i < end; i++)
    {
        for (int j = i + 1; j < end; j++)
        {
            if (array[i] == array[j])
            {
                alternate++;
            }
        }
    }
    if (alternate == 0)
    {
        return true;
    }
    else
    {
        return false;
    }
}