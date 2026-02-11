using FluentValidation;
using TableWorks.Application.DTOs.IndexCards;

namespace TableWorks.Application.Validators.IndexCards;

public sealed class CreateIndexCardRequestValidator : AbstractValidator<CreateIndexCardRequest>
{
    public CreateIndexCardRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.");

        RuleFor(x => x.Content)
            .NotNull().WithMessage("Content is required.")
            .MaximumLength(10000).WithMessage("Content must not exceed 10000 characters.");

        RuleFor(x => x.Color)
            .MaximumLength(20).WithMessage("Color must not exceed 20 characters.")
            .When(x => x.Color is not null);
    }
}
