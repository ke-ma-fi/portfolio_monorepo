#include <cs50.h>
#include <ctype.h>
#include <math.h>
#include <stdio.h>
#include <string.h>

int count_letters(string text);
int count_words(string text);
int count_sentences(string text);
int calc_grade(int letters, int words, int sent);

int main(void)
{

    string text = get_string("Text: ");

    int grade = calc_grade(count_letters(text), count_words(text), count_sentences(text));

    printf("Letters %i, Words %i, Sentences %i\n",count_letters(text), count_words(text), count_sentences(text));

    if (grade > 16)
    {
        printf("Grade 16+\n");
    }
    else if (grade < 1)
    {
        printf("Before Grade 1\n");
    }
    else
    {
        printf("Grade %i\n", grade);
    }
}

int count_letters(string text)
{
    int count = 0;
    int n = strlen(text);
    for (int i = 0; i < n; i++)
    {
        if ((text[i] >= 65 && text[i] <= 90) || (text[i] >= 97 && text[i] <= 122))
        {
            count++;
        }
    }
    return count;
}

int count_words(string text)
{
    int count = 0;
    int n = strlen(text);
    for (int i = 0; i < n; i++)
    {
        if (text[i] == 32)
        {
            count++;
        }
    }
    return count + 1;
}

int count_sentences(string text)
{
    int count = 0;
    int n = strlen(text);
    for (int i = 0; i < n; i++)
    {
        if (text[i] == 33 || text[i] == 46 || text[i] == 63)
        {
            count++;
        }
    }
    return count;
}

int calc_grade(int letters, int words, int sent)
{
    float L = ((float) letters / words) * 100.00;
    float S = ((float) sent / words) * 100.00;
    float index = (0.0588 * L) - (0.296 * S) - 15.8;

    return round(index);
}