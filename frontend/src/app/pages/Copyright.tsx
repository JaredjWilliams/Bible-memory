import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Copyright() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">Copyright Information</h1>
              <p className="text-muted-foreground">
                This application uses Scripture from the English Standard Version (ESV)
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h2 className="font-semibold text-lg mb-2">ESV Bible Copyright</h2>
                <p className="text-gray-700 leading-relaxed">
                  Scripture quotations are from the ESV® Bible (The Holy Bible, English
                  Standard Version®), copyright © 2001 by Crossway, a publishing ministry
                  of Good News Publishers. Used by permission. All rights reserved.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-lg mb-2">Permissions</h2>
                <p className="text-gray-700 leading-relaxed">
                  The ESV text may be quoted (in written, visual, or electronic form) up
                  to and inclusive of five hundred (500) consecutive verses without
                  express written permission of the publisher, provided that the verses
                  quoted do not amount to more than one-half of any one book of the Bible
                  or its equivalent measured in bytes and provided that the verses quoted
                  do not account for twenty-five percent (25%) or more of the total text
                  of the work in which they are quoted.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-lg mb-2">Notice Requirement</h2>
                <p className="text-foreground leading-relaxed mb-2">
                  All quotations must include the following notice:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="italic">
                    Scripture quotations are from the ESV® Bible (The Holy Bible, English
                    Standard Version®), copyright © 2001 by Crossway, a publishing
                    ministry of Good News Publishers. Used by permission. All rights
                    reserved.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-semibold text-lg mb-2">Additional Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  For more information about the ESV Bible, please visit{' '}
                  <a
                    href="https://www.esv.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    www.esv.org
                  </a>
                  .
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-muted-foreground text-xs">
                  This application is designed for personal Bible memorization and is not
                  affiliated with or endorsed by Crossway.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
