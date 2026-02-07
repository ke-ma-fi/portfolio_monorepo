// Write a function to replace vowels with numbers
// Get practice with strings
// Get practice with command line
// Get practice with switch

#include <cs50.h>
#include <stdio.h>
#include <string.h>

string replace(string text);

int main(int argc, string argv[])
{
    if (argc != 2)
    {
        printf("Usage: ./no-vowels word\n");
        return 1;
    }

    printf("%s\n", replace(argv[1]));
}

string replace(string text)
{
    int n = strlen(text);
    for (int i = 0; i < n; i++)
    {
        switch (text[i])
        {
            case 65:
                text[i] = 54;
                break;

            case 97:
                text[i] = 54;
                break;

            case 69:
                text[i] = 51;
                break;

            case 101:
                text[i] = 51;
                break;

            case 73:
                text[i] = 49;
                break;

            case 105:
                text[i] = 49;
                break;

            case 79:
                text[i] = 48;
                break;

            case 111:
                text[i] = 48;
                break;

            default:
                break;
        }
    }
    return text;
}
